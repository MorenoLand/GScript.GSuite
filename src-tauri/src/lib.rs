use std::collections::HashMap;
use std::sync::Mutex;
use std::io::Write;
use std::time::Duration;
use tauri::{State, Manager, Emitter};

fn crc32(data: &[u8]) -> u32 {
    let mut c = 0xFFFFFFFFu32;
    for &b in data { c ^= b as u32; for _ in 0..8 { c = if c & 1 != 0 { (c >> 1) ^ 0xEDB88320 } else { c >> 1 }; } }
    !c
}

#[derive(Default)]
struct WorkspaceIndex { name_to_path: HashMap<String, String> }

struct AppState {
    index: Mutex<WorkspaceIndex>,
    last_dir: Mutex<Option<String>>,
    rescan_done: Mutex<bool>,
    scan_running: Mutex<bool>,
    open_file_arg: Mutex<Option<String>>,
}

#[derive(serde::Serialize, Clone)]
struct ScanChunk { image_keys: Vec<String>, gani_files: Vec<(String, String)>, sound_files: Vec<String>, level_files: Vec<(String, String)>, done: bool, image_count: usize, gani_count: usize }

#[derive(serde::Serialize, Clone)]
struct CacheResult { dir: String, entries: Vec<(String, String, u32)> }

fn exe_dir() -> std::path::PathBuf {
    std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.to_path_buf())).unwrap_or_else(|| ".".into())
}

fn walk_dir(dir: &std::path::Path) -> Vec<(String, String)> {
    let sep = std::path::MAIN_SEPARATOR;
    let mut result = Vec::new();
    fn inner(dir: &std::path::Path, sep: char, result: &mut Vec<(String, String)>) {
        if let Ok(rd) = std::fs::read_dir(dir) {
            for e in rd.flatten() {
                let p = e.path();
                if p.is_dir() { inner(&p, sep, result); continue; }
                let name = match p.file_name().and_then(|n| n.to_str()) { Some(n) => n.to_lowercase(), None => continue };
                let ext = p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase());
                let fp = p.to_string_lossy().replace('/', &sep.to_string());
                match ext.as_deref() {
                    Some("png")|Some("gif")|Some("jpg")|Some("jpeg")|Some("webp")|Some("bmp")|Some("mng")|Some("gani")|Some("wav")|Some("mp3")|Some("ogg")|Some("mid")|Some("midi")|Some("nw")|Some("gmap")|Some("graal")|Some("zelda") => result.push((name, fp)),
                    _ => {}
                }
            }
        }
    }
    inner(dir, sep, &mut result);
    result
}

fn do_scan(h: &tauri::AppHandle, st: &State<AppState>, d: &str, emit_progress: bool) -> Vec<(String, String)> {
    let sep = std::path::MAIN_SEPARATOR;
    let base = std::path::Path::new(d);
    const CHUNK: usize = 500;
    let mut img_buf = Vec::with_capacity(CHUNK);
    let mut gani_buf: Vec<(String, String)> = Vec::new();
    let mut snd_buf: Vec<String> = Vec::new();
    let mut lvl_buf: Vec<(String, String)> = Vec::new();
    let mut tot_img = 0usize;
    let mut tot_gani = 0usize;
    let mut batch = Vec::with_capacity(CHUNK);
    let cache_path = exe_dir().join("FILENAMECACHE.txt");
    let mut cache_file = std::fs::File::create(&cache_path).ok();
    if let Some(ref mut f) = cache_file { let _ = f.write_all(format!("DIR|{}\n", d).as_bytes()); }
    let mut all_entries: Vec<(String, String)> = Vec::new();
    fn walk(dir: &std::path::Path, base: &std::path::Path, batch: &mut Vec<(String, String)>, gani_buf: &mut Vec<(String, String)>, snd_buf: &mut Vec<String>, lvl_buf: &mut Vec<(String, String)>, img_buf: &mut Vec<String>, tot_img: &mut usize, tot_gani: &mut usize, all: &mut Vec<(String, String)>, h: &tauri::AppHandle, st: &State<AppState>, sep: char, cache_file: &mut Option<std::fs::File>, emit: bool) {
        if let Ok(rd) = std::fs::read_dir(dir) {
            for e in rd.flatten() {
                let p = e.path();
                if p.is_dir() { walk(&p, base, batch, gani_buf, snd_buf, lvl_buf, img_buf, tot_img, tot_gani, all, h, st, sep, cache_file, emit); continue; }
                let name = match p.file_name().and_then(|n| n.to_str()) { Some(n) => n.to_lowercase(), None => continue };
                let ext = p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase());
                let fp = p.to_string_lossy().replace('/', &sep.to_string());
                let relevant = match ext.as_deref() {
                    Some("png")|Some("gif")|Some("jpg")|Some("jpeg")|Some("webp")|Some("bmp")|Some("mng") => { img_buf.push(name.clone()); batch.push((name.clone(), fp.clone())); all.push((name, fp.clone())); *tot_img += 1; true }
                    Some("gani") => { gani_buf.push((name.clone(), fp.clone())); batch.push((name.clone(), fp.clone())); all.push((name, fp.clone())); *tot_gani += 1; true }
                    Some("wav")|Some("mp3")|Some("ogg")|Some("mid")|Some("midi") => { snd_buf.push(fp.clone()); all.push(("".into(), fp.clone())); true }
                    Some("nw")|Some("gmap")|Some("graal")|Some("zelda") => { lvl_buf.push((name.clone(), fp.clone())); batch.push((name.clone(), fp.clone())); all.push((name, fp.clone())); true }
                    _ => false
                };
                if relevant { if let Some(ref mut f) = cache_file { let rel = std::path::Path::new(&fp).strip_prefix(base).unwrap_or(std::path::Path::new(&fp)); let rs = rel.to_string_lossy().replace('/', &sep.to_string()); let _ = f.write_all(format!("{},{}\n", rs, crc32(rs.as_bytes())).as_bytes()); } }
                if emit && batch.len() >= CHUNK {
                    { let mut idx = st.index.lock().unwrap(); for (k, v) in batch.iter() { if !k.is_empty() { idx.name_to_path.insert(k.clone(), v.clone()); } } }
                    let _ = h.emit("workspace_chunk", ScanChunk { image_keys: img_buf.drain(..).collect(), gani_files: gani_buf.drain(..).collect(), sound_files: snd_buf.drain(..).collect(), level_files: lvl_buf.drain(..).collect(), done: false, image_count: *tot_img, gani_count: *tot_gani });
                    batch.clear();
                }
            }
        }
    }
    walk(base, base, &mut batch, &mut gani_buf, &mut snd_buf, &mut lvl_buf, &mut img_buf, &mut tot_img, &mut tot_gani, &mut all_entries, h, st, sep, &mut cache_file, emit_progress);
    { let mut idx = st.index.lock().unwrap(); for (k, v) in batch.iter() { if !k.is_empty() { idx.name_to_path.insert(k.clone(), v.clone()); } } }
    if emit_progress { let _ = h.emit("workspace_chunk", ScanChunk { image_keys: img_buf, gani_files: gani_buf, sound_files: snd_buf, level_files: lvl_buf, done: true, image_count: tot_img, gani_count: tot_gani }); }
    all_entries
}

#[tauri::command]
fn scan_workspace(dir: String, state: State<AppState>, app: tauri::AppHandle) -> Result<(), String> {
    state.index.lock().unwrap().name_to_path.clear();
    *state.last_dir.lock().unwrap() = Some(dir.clone());
    let h = app.clone();
    let d = dir;
    std::thread::spawn(move || {
        let st = h.state::<AppState>();
        { let mut sr = st.scan_running.lock().unwrap(); if *sr { return; } *sr = true; }
        do_scan(&h, &st, &d, true);
        *st.scan_running.lock().unwrap() = false;
    });
    Ok(())
}

#[tauri::command]
fn resolve_path(name: String, state: State<AppState>) -> Option<String> {
    state.index.lock().unwrap().name_to_path.get(&name.to_lowercase()).cloned()
}

#[tauri::command]
fn load_workspace_cache(app: tauri::AppHandle) -> Result<Option<CacheResult>, String> {
    let path = exe_dir().join("FILENAMECACHE.txt");
    if !path.exists() { return Ok(None); }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let sep = std::path::MAIN_SEPARATOR;
    let mut dir = String::new();
    let mut entries: Vec<(String, String, u32)> = Vec::new();
    for line in content.lines() {
        if let Some(d) = line.strip_prefix("DIR|") { dir = d.to_string(); continue; }
        let mut parts = line.rsplitn(2, ',');
        if let (Some(crc_s), Some(rel)) = (parts.next(), parts.next()) {
            let name = std::path::Path::new(rel).file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
            let full = if dir.is_empty() { rel.to_string() } else { format!("{}{}{}", dir, sep, rel) };
            entries.push((name, full, crc_s.trim().parse().unwrap_or(0)));
        }
    }
    if dir.is_empty() { return Ok(None); }
    let st = app.state::<AppState>();
    { let mut idx = st.index.lock().unwrap(); for (name, full, _crc) in &entries { if !name.is_empty() { idx.name_to_path.insert(name.clone(), full.clone()); } } }
    *st.last_dir.lock().unwrap() = Some(dir.clone());
    let h = app.clone();
    let watch_dir = dir.clone();
    std::thread::spawn(move || {
        let st = h.state::<AppState>();
        if *st.rescan_done.lock().unwrap() { return; }
        { let mut sr = st.scan_running.lock().unwrap(); if *sr { return; } *sr = true; }
        std::thread::sleep(Duration::from_secs(2));
        let current = walk_dir(std::path::Path::new(&watch_dir));
        let old_count = st.index.lock().unwrap().name_to_path.len();
        let mut new_keys: Vec<String> = current.iter().filter(|(k, _)| !k.is_empty()).map(|(k, _)| k.clone()).collect();
        new_keys.sort();
        let changed = old_count != new_keys.len() || {
            let mut old_keys: Vec<String> = st.index.lock().unwrap().name_to_path.keys().cloned().collect();
            old_keys.sort(); old_keys != new_keys
        };
        if changed {
            log::info!("[workspace] rescan detected changes ({} vs {}), updating", old_count, new_keys.len());
            let sep = std::path::MAIN_SEPARATOR;
            let base = std::path::Path::new(&watch_dir);
            { let mut idx = st.index.lock().unwrap(); idx.name_to_path.clear(); for (k, v) in &current { if !k.is_empty() { idx.name_to_path.insert(k.clone(), v.clone()); } } }
            let cache_path = exe_dir().join("FILENAMECACHE.txt");
            if let Ok(mut f) = std::fs::File::create(&cache_path) {
                let _ = f.write_all(format!("DIR|{}\n", watch_dir).as_bytes());
                for (_, fp) in &current { let rel = std::path::Path::new(fp).strip_prefix(base).unwrap_or(std::path::Path::new(fp)); let rs = rel.to_string_lossy().replace('/', &sep.to_string()); let _ = f.write_all(format!("{},{}\n", rs, crc32(rs.as_bytes())).as_bytes()); }
            }
            let image_ex = std::collections::HashSet::from(["png","gif","jpg","jpeg","webp","bmp","mng"]);
            let level_ex = std::collections::HashSet::from(["nw","gmap","graal","zelda"]);
            let mut img_keys = Vec::new(); let mut gani_files = Vec::new(); let mut snd_files = Vec::new(); let mut lvl_files = Vec::new();
            let mut img_count = 0usize; let mut gani_count = 0usize;
            for (name, fp) in &current {
                let dot = name.rfind('.').map(|i| &name[i+1..]).unwrap_or("");
                if image_ex.contains(dot) { img_keys.push(name.clone()); img_count += 1; }
                else if dot == "gani" { gani_files.push((name.clone(), fp.clone())); gani_count += 1; }
                else if level_ex.contains(dot) { lvl_files.push((name.clone(), fp.clone())); }
                else if !name.is_empty() { snd_files.push(fp.clone()); }
            }
            let _ = h.emit("workspace_chunk", ScanChunk { image_keys: img_keys, gani_files, sound_files: snd_files, level_files: lvl_files, done: true, image_count: img_count, gani_count });
        } else {
            log::info!("[workspace] rescan: no changes ({} files)", old_count);
        }
        *st.scan_running.lock().unwrap() = false;
        *st.rescan_done.lock().unwrap() = true;
    });
    Ok(Some(CacheResult { dir, entries }))
}

#[tauri::command]
fn get_open_file_arg(state: State<AppState>) -> Option<String> {
    state.open_file_arg.lock().unwrap().clone()
}

#[tauri::command]
fn register_file_associations() -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = exe.to_string_lossy();
    let exts = [("nw","Graal Level"),("gmap","Graal Map"),("gani","Graal Animation"),("zelda","Graal Level (Zelda)"),("graal","Graal Level")];
    let mut failed = Vec::new();
    for (ext, desc) in &exts {
        let prog_id = format!("GaniEditorWeb.{}", ext);
        let ok1 = std::process::Command::new("reg").args(["add",&format!("HKCU\\Software\\Classes\\.{}",ext),"/ve","/d",&prog_id,"/f"]).status().map(|s| s.success()).unwrap_or(false);
        if !ok1 { failed.push(ext.to_string()); continue; }
        std::process::Command::new("reg").args(["add",&format!("HKCU\\Software\\Classes\\{}",prog_id),"/ve","/d",desc,"/f"]).status().ok();
        let cmd = format!("\"{}\" \"%1\"", exe_str);
        std::process::Command::new("reg").args(["add",&format!("HKCU\\Software\\Classes\\{}\\shell\\open\\command",prog_id),"/ve","/d",&cmd,"/f"]).status().ok();
    }
    if failed.is_empty() { Ok("Registered .nw .gmap .gani .zelda .graal".into()) } else { Err(format!("Failed: {}", failed.join(", "))) }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let file_arg: Option<String> = std::env::args().nth(1).filter(|a| std::path::Path::new(a).exists());
    tauri::Builder::default()
        .manage(AppState { index: Mutex::new(WorkspaceIndex::default()), last_dir: Mutex::new(None), rescan_done: Mutex::new(false), scan_running: Mutex::new(false), open_file_arg: Mutex::new(file_arg) })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![scan_workspace, resolve_path, load_workspace_cache, get_open_file_arg, register_file_associations])
        .setup(|app| { if cfg!(debug_assertions) { app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?; } Ok(()) })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
