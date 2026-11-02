import UIKit
import Capacitor

/// Opens the iOS print sheet for the current page. WKWebView ignores `window.print()`,
/// so the web app calls `NativePrint.printPage()` (see src/native/platform.js) instead.
/// The sheet also lets people save the Executive Brief as a PDF.
@objc(NativePrintPlugin)
public class NativePrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativePrintPlugin"
    public let jsName = "NativePrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "printPage", returnType: CAPPluginReturnPromise)
    ]

    @objc func printPage(_ call: CAPPluginCall) {
        let jobName = call.getString("jobName") ?? "ProximaStruc"
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("The page is not available to print.")
                return
            }
            let printInfo = UIPrintInfo(dictionary: nil)
            printInfo.outputType = .general
            printInfo.jobName = jobName

            let controller = UIPrintInteractionController.shared
            controller.printInfo = printInfo
            controller.printFormatter = webView.viewPrintFormatter()
            controller.present(animated: true) { _, completed, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve(["completed": completed])
                }
            }
        }
    }
}
