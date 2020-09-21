/*
 Copyright 2016 Carmilla Mina Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

class DeviceChecker {
  constructor() {
    const { userAgent } = window.navigator;
    this.isStandalone = window.navigator.standalone;
    this.DeviceEnum = {
      IOS: 'ios',
      ANDROID: 'android',
      OTHER: 'other',
      IOSOLD: 'iosOld',
    };
    this.BrowserEnum = {
      SAFARIDESKTOP: 'safari desktop',
      OTHER: 'other',
    };
    this.deviceType = (() => {
      if (userAgent.match(/iP(hone|ad|od)/i) !== null) {
        if (userAgent.match(/OS (7_|8_|9_)/i) !== null) {
          return this.DeviceEnum.IOSOLD;
        }

        return this.DeviceEnum.IOS;
      }

      if (userAgent.match(/Android/i) !== null) {
        return this.DeviceEnum.ANDROID;
      }

      return this.DeviceEnum.OTHER;
    })();
    this.browserType = (() => {
      if (this.deviceType !== this.DeviceEnum.IOS && userAgent.match(/Safari/)) {
        return this.BrowserEnum.SAFARIDESKTOP;
      }

      return this.BrowserEnum.OTHER;
    })();
    this.isTouchDevice = this.deviceType === this.DeviceEnum.IOS || this.deviceType === this.DeviceEnum.ANDROID;
  }
}

const deviceChecker = new DeviceChecker();

export default deviceChecker;
