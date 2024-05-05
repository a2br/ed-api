# ecoledirecte.js &middot; ![GitHub](https://img.shields.io/github/license/a2br/ecoledirecte.js) ![npm](https://img.shields.io/npm/v/ecoledirecte.js) ![npm](https://img.shields.io/npm/dw/ecoledirecte.js)

> ⚠ **As of August 8, 2023, this module is no longer maintained**: This means that although the module is perfectly functioning, I will not update it to comply to future EcoleDirecte API changes. The module may fail to fetch or send data. I would greatly appreciate PRs for feature requests / bug patches, as I no longer have the time to work on this project. Thank you.

Browse EcoleDirecte's private API with ED.js, an unofficial API client.

`ed.js` is a Promise-based module, built on TypeScript for a better IntelliSense and type-guarded features.

## Examples

> Warning: these examples might not work on your machine (depending on whether you're using `commonjs` or ES6 `module`)

### Get the homework of a day

```typescript
import { Session } from "ecoledirecte.js";

// Create a new Session.
const session = new Session("identifiant", "motdepasse");

// If you need A2F 

// A2F objet
const A2FParams = {
	"question": "answer",
	"What is your day of birth ?": "25"
	// ...
};

// Bring your session to life!
const account = await session.login(/* A2FParams */).catch(err => {
	console.error("This login did not go well.");
});

// Is it a student account?
if (!account || account.type !== "student") throw new Error("Not a student!");

// Get the homework due for a specific date as a simplified array
const homework = await account.getHomework({ dates: "2021-01-14" });

// Every piece of data from the API is reformatted  (eg: base64 string are
// converted to text/HTML). The raw data remains always available as _raw
console.log(homework[2].contenuDeSeance.content.text);
```

### Introduction to events

Events can be used to do something when something else happens, in real-time. (very specific, as you can tell)
For instance, the following will log the method and the url each time `ed.js` sends a request to the EcoleDirecte servers.

```typescript
import { events } from "ecoledirecte.js";

events.on("request", ({ method, url }) => console.log(method, url));
// POST https://api.ecoledirecte.com/v3/login.awp
// POST https://api.ecoledirecte.com/v3/eleves/4179/timeline.awp
// ...
```

## Dependencies walkthrough

| Dependency                                                                     | Description                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [node-fetch](https://www.npmjs.com/package/node-fetch)                         | A light-weight module that brings window.fetch to Node.js                                         |
| [html-to-text](https://www.npmjs.com/package/html-to-text)                     | Converter that parses HTML and returns text.                                                      |
| [ecoledirecte-api-types](https://www.npmjs.com/package/ecoledirecte-api-types) | Module that maps the routes and types related to EcoleDirecte's API. Originally a part of `ed.js` |
