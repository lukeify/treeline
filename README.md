# Treeline

![GitHub release (latest by date)](https://img.shields.io/github/v/release/lukeify/treeline)
![GitHub](https://img.shields.io/github/license/lukeify/treeline)
![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/lukeify/treeline)
![GitHub issues](https://img.shields.io/github/issues/lukeify/treeline)
![GitHub last commit](https://img.shields.io/github/last-commit/lukeify/treeline)
![Twitter Follow](https://img.shields.io/twitter/follow/lukeifynz?style=social)

Treeline is a simple, opinionated μSSG (micro-Static Site Generator) that encourages HTML-native concepts for page generation and provides a Markdown-first approach to post creation, and is currently designed to run as a Snowpack plugin. Here's an unrelated heroic image designed to inspire.

![](hero.jpg)

## Instructions

You'll need Snowpack in your project to begin. Simply include `treeline` as a dependency:

```
yarn add -D treeline
```

Then, add `treeline` as a plugin to your `snowpack.config.js`, being sure to specify options for both the `templateDir`, where Treeline templates live; and `source`, where your pages are stored. On Snowpack build, the layout templates specified will be interpolated with the content of the pages you've created.

```js
[
  'treeline',
  {
    templateDir: './templates',
    source: './',
  },
];
```

## Getting Started

To build and improve `treeline`, follow along!

### Prerequisites

You'll need `git`, along with our own dependencies installed.

### Installation

```
git@github.com:lukeify/treeline.git
cd treeline
yarn install
```

### Building

Treeline will be built on publish with npm/yarn. To watch for file changes: `yarn run watch`. It's helpful to have an associated Snowpack project to develop treeline with. Use Yarn's `link` functionality as described in the [Snowpack plugin development docs](https://www.snowpack.dev/guides/plugins#testing) to associate your treeline instance with a Snowpack project.

## Deployment

On commits to the master branch, treeline will be published.

## Built With

- Node.js (runtime environment)
- Snowpack (Plugin host)
- JSDOM (for parsing provided templates/pages)
- TypeScript (because obviously)

## Contributing

Small contributions are welcome, but must be in keeping with the treeline ideology (as described in the introduction).

## Todos & Errata

- Better format and indent output HTML.
- Write a handful of tests.

## Versioning

`treeline` adheres to [semantic versioning](https://semver.org), and while considered unstable, will be versioned as `0.x.x`.

## Author

Luke Davia.
