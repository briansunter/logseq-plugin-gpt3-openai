<p align="center">
  <a href="" rel="noopener">
 <img width=400px height=200px src="./docs/openai.webp" alt="Project logo"></a>
 <img width=200px height=200px src="./docs/logseq.png" alt="Project logo"></a>
</p>

<h3 align="center">logseq-plugin-gpt3-openai</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/briansunter/logseq-plugin-gpt3-openai.svg)](https://github.com/briansunter/logseq-plugin-gpt3-openai)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/briansunter/logseq-plugin-gpt3-openai.svg)](https://github.com/briansunter/logseq-plugin-gpt3-openai)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> A plugin for GPT-3 AI assisted note taking in Logseq
    <br>
</p>

## Usage

Just type `/gpt3` in a block or select `gpt3` from the block menu.

[See here for example usages](https://beta.openai.com/examples).

## Demo

![logseq gpt3 openai demo](docs/demo.gif)

## 📝 Table of Contents

- [About](#about)
- [Examples with GIFs](#examples)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [TODO](../TODO.md)
- [Contributing](../CONTRIBUTING.md)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## About <a name = "about"></a>

`logseq-plugin-gpt3-openai` allows users to generate human-like text using GPT-3 within the LogSeq editor.

Write a GPT-3 command in a block, then run the open `gpt3` command via the slash or block menu. The plugin will generate a GPT-3 response using the OpenAI API and insert it beneath the block.

## Getting Started <a name = "getting_started"></a>

- You need to [get an OpenAI API Key here](https://openai.com/api/) and add the key in the plugin settings.

- Make sure you [read OpenAI's usage guidelines](https://beta.openai.com/docs/usage-guidelines) and avoid generating certain types of content.

- Download the plugin in the Logseq marketplace by searching for `gpt3` or `openai`.

## Example Use Cases <a name = "examples"></a>

## Summarizing or explaining a block of text

![logseq gpt3 openai tldr](docs/tldr.gif)
## Creating bullet point outlines for a given topic

![logseq gpt3 openai outline](docs/outline.gif)
## Creating study plan for a given topic
![logseq gpt3 openai study](docs/study.gif)

## Write a travel itinerary 

![](docs/travel.gif)
## Explain how to do something

![logseq gpt3 openai workout](docs/workout.gif)

## Parse tabular data from plain english

![logseq gpt3 openai table](docs/table.gif)

- Generate code to do a given task
- Correct grammar
- Translate into other languages

- Classification and keyword tagging of text
- Generate lists of given topics
  - `List 10 top selling science fiction books`
- Write about a given topic
  - `Write a tagline for an ice cream shop.`
- Answer Questions
  - `Q: How does a telescope work?`
## Just for fun

### Crazy recipes

![](docs/weirdpizza.gif)]
## FAQ <a name = "faq"></a>
### What is GPT-3 and OpenAI, and how does it work?
See [this article for a good overview.](https://www.vox.com/future-perfect/21355768/gpt-3-ai-openai-turing-test-language)

###  Errors
I see an "OpenAI Plugin Error"

![openai](docs/openai-error.png)]

- Open the developer tools (Menu -> View -> Toggle Developer tools)

![](docs/debug.png)

![](docs/response.png)

- See if you can figure out the error on your own. Maybe you had a network issue if it says something like "timed out." Sometimes the OpenAI API has issues. You also have a limited number of tokens, so you may run out and need to refill. 
#### OpenAI Quota Reached

Your free trial is over, or you've run out of tokens. You can refill your tokens [here](https://beta.openai.com/account/billing/overview).
#### `OpenAI Rate Limited`
OpenAI has limits on how often you can call them. If you get this error, you'll need to wait a bit before trying again. See this [article](https://help.openai.com/en/articles/5955598-is-api-usage-subject-to-any-rate-limits) for more info on the rate limits. You can call it faster if you have a paid account.
#### `Refused to set unsafe header "User Agent"`
This error doesn't cause any issues besides the error message in the console. It's a known issue with the OpenAI API. See [this issue](https://github.com/openai/openai-node/issues/6) for more details. I'm working on a PR to their library to support browser usage. Ignore this error for now.

- If you can't figure it out based on the error message and it doesn't go away. Make an issue on GitHub.
### Prerequisites

[An API key from OpenAI Click here to get one](https://beta.openai.com/account/api-keys)

### Installing

```
npm i
```

## Running the tests <a name = "tests"></a>

- [ ] Add Tests

## Build <a name="usage"></a>

```
npm run build
```

## 💻 Local Development

This enables the local dev server with hot reloading, via the logseq vite plugin.

```
npm i
npm run dev
```

### Prod build

First run `npm i` and `npm run build`

Open LogSeq

Go to Settings > Turn on Developer Mode

This will bring up the "Plugins" entry in three dots more menu list on the top right of the head bar. Go to Plugins page, and you will get a button with the  `Load unpacked plugin label`. Select the root folder of this plugin repo.

Make sure you add your [OpenAI Key](https://beta.openai.com/account/api-keys)

## 🚀 Deployment <a name = "deployment"></a>

Creates a build using semantic release when a commit is pushed with a smart commit message.

## Built Using <a name = "built_using"></a>

- [LogSeq](https://logseq.com/) - Privacy-first, open-source knowledge base that works on top of local plain-text Markdown and Org-mode files.
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling

## Contributing <a name = "contributing"></a>

Do you have a bug or idea? I would love to hear from you! [Open a Github issue here.](https://github.com/briansunter/logseq-plugin-gpt3-openai/issues/new)

PRs welcome. [Open an issue](https://github.com/briansunter/logseq-plugin-gpt3-openai/issues/new) to discuss first if possible.
## Authors <a name = "authors"></a>

- [@briansunter](https://github.com/briansunter) - Author

## Acknowledgements <a name = "acknowledgement"></a>

- [OpenAI Examples](https://beta.openai.com/examples)
