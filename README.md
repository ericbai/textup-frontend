# Textup Frontend

This is the frontend Ember app that connects to the [TextUp Grails backend](https://github.com/TextUp/textup-backend).

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* Clone the repository. Since this repository uses [`git subtree`](https://github.com/git/git/blob/master/contrib/subtree/git-subtree.txt) to share core styles with other repositories, this repository and its subtree can be cloned in one of the two following ways.
 1. `git clone --recursive <repository-url>`
 2. `git fetch` + `git submodule sync --recursive` + `git submodule update --init --recursive`
* Change into the new directory
* For ease of use, create a remote to the core styles repository with `git remote add styles git@github.com:TextUp/textup-styles.git`
* `npm install`
* `bower install`

## Pulling / Pushing

Separate changes to the subtree application from changes to the [core styles](https://github.com/TextUp/textup-styles). When pushing or pulling from this repository, use the standard methods. When working with changes that pertain to the core styles, you must first use the following commands to update your copy of the core styles

* `git subtree pull  --prefix=app/styles/core --squash styles master`

When you need to backport any changes to the core styles repository, the simplest way to do so is by using this command

* `git subtree push  --prefix=app/styles/core --squash styles master`

However, the main drawback of this command is that all commits that touched the subtree and used. If we need more control, we can cherry pick the commits we want to push to the subtree.

[More details about this and about all git-subtree related commands can be found at this tutorial](https://medium.com/@porteneuve/mastering-git-subtrees-943d29a798ec#.s0lfst7jk)

## Running / Development

* `ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Details coming soon when the docs go up.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)