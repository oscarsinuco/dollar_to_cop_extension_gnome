const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Soup = imports.gi.Soup;
const _httpSession = new Soup.Session();
const FROM_CURRENCY = "USD";
const TO_CURRENCY = "COP";
const TIME_INTERVAL_SECONDS = 345; //Time interval in seconds (each request after 5.75 minutes).
const URL_API = `https://api.apilayer.com/exchangerates_data/convert?to=${TO_CURRENCY}&from=${FROM_CURRENCY}&amount=1`;
const API_KEY = "YOUR_SITE_KEY_HERE"; //Site key to use in the API call. Please visit https://apilayer.com/marketplace/exchangerates_data-api#pricing and subscribe to free plan.
// const URL_API = "http://localhost:3000/";
let timeout = null;
/**
 * Extension class.
 */
class Extension {
  /**
   * Constructor for extension.
   */
  constructor(buttonText) {
    this.buttonText = buttonText;
    this._indicator = null;
  }

  /**
   * Function to send http request to server.
   *
   * @param {*} url - Url to send request to.
   * @param {*} type - Type of request.
   * @param {*} headers - Headers to add to request.
   * @returns - Response from server.
   */
  send_request(url, type = "GET", headers = {}) {
    let message = Soup.Message.new(type, url);
    for (let key in headers) {
      message.request_headers.append(key, headers[key]);
    }
    message.request_headers.set_content_type("application/json", null);
    let responseCode = _httpSession.send_message(message);
    let out;
    if (responseCode == 200) {
      try {
        out = JSON.parse(message.response_body.data);
      } catch (error) {
        log(error);
      }
    }
    return out;
  }

  /**
   * Function to enable extension.
   */
  enable() {
    log(`enabling ${Me.metadata.name}`);
    this.paintDolarPrinceInStatusArea();
  }

  /**
   * Function to paint dolar prince in status area.
   */
  paintDolarPrinceInStatusArea() {
    let indicatorName = `${Me.metadata.name} Indicator`;
    // Create a panel button
    this._indicator = new PanelMenu.Button(0.0, indicatorName, false);

    log("Making request...");
    // Make http request to get currency.
    const result = this.send_request(URL_API, "GET", {
      apikey: API_KEY,
    });
    const value = result.result;

    // Add label to indicator
    this.buttonText = new St.Label({
      text: `1USD = $${value}`,
      style_class: "label-dollar",
    });
    this._indicator.add_child(this.buttonText);
    this.initRefreshProcess(TIME_INTERVAL_SECONDS);
    Main.panel.addToStatusArea(indicatorName, this._indicator);
  }

  /**
   * Function to refresh value text button after time interval.
   *
   * @param {*} interval - Time interval in seconds.
   */
  initRefreshProcess(interval) {
    timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
      log("Refreshing...");
      const r = this.send_request(URL_API, "GET", {
        apikey: API_KEY,
      });
      const v = r.result;
      this.buttonText.set_text(`1USD = $${v}`);
      return GLib.SOURCE_CONTINUE;
    });
  }

  /**
   * Function to disable extension.
   */
  disable() {
    log(`disabling ${Me.metadata.name}`);
    this._indicator.destroy();
    this._indicator = null;
    if (timeout) {
      GLib.Source.remove(timeout);
      timeout = null;
    }
  }
}

/**
 * Function to init extension.
 *
 * @returns - Extension instance.
 */
function init() {
  log(`initializing ${Me.metadata.name}`);
  return new Extension();
}
