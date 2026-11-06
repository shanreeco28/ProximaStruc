use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

/// The live site the window shows. Keep in sync with `capabilities/default.json`.
const SITE: &str = "https://proximastruc.vercel.app";

/// Hosts that stay inside the app window (the site itself and Google/Firebase sign-in).
const INTERNAL_HOSTS: &[&str] = &[
    "proximastruc.vercel.app",
    "accounts.google.com",
    "apis.google.com",
];
const INTERNAL_SUFFIXES: &[&str] = &[".firebaseapp.com", ".web.app"];

fn stays_in_app(url: &Url) -> bool {
    if matches!(url.scheme(), "about" | "data" | "blob" | "tauri") {
        return true;
    }
    let host = url.host_str().unwrap_or("");
    INTERNAL_HOSTS.contains(&host) || INTERNAL_SUFFIXES.iter().any(|s| host.ends_with(s))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let site: Url = SITE.parse().expect("SITE is a valid URL");

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(site))
                .title("ProximaStruc")
                .inner_size(1360.0, 860.0)
                .min_inner_size(960.0, 640.0)
                // No native title bar, menu or window frame: the page draws its own thin bar.
                .decorations(false)
                .initialization_script(include_str!("titlebar.js"))
                .on_navigation(move |url| {
                    if stays_in_app(url) {
                        true
                    } else {
                        // Any other link opens in the user's normal browser.
                        let _ = handle.opener().open_url(url.as_str(), None::<&str>);
                        false
                    }
                })
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ProximaStruc desktop");
}
