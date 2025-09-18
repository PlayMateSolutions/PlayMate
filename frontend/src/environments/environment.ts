// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://script.google.com/macros/s/AKfycbyMDOC9nYxJv8mgpqE6i6VFF3UUy9NGPSTAGxXzihntX4KLXMnFz6moNR9ZcDJm3vZ2/dev',
  defaultAuthToken: 'dev-token-playmate-api',
  googleSignInClientId: '1031239235658-04jeuifg37vruvmkiu71m45tskj94tnv.apps.googleusercontent.com', // Used for Capacitor Social Login
  // googleSignInClientId: '739815252489-2p9ne9e8vdeub77m2irkn20ga7vre7fp.apps.googleusercontent.com',
  // authConfig: {
  //   allowedDomains: ['localhost:4200', 'localhost:8100'],
  //   corsConfig: {
  //     allowedOrigins: ['http://localhost:4200', 'http://localhost:8100'],
  //     allowCredentials: false
  //   }
  // }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
