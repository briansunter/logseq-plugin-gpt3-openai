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

<https://user-images.githubusercontent.com/2816289/172034704-2fd978fc-a741-4055-a5b1-9f49d43a28c3.mp4>

## 📝 Table of Contents

- [About](#about)
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

Just write a GPT-3 command in a block, then run the open `openai` command via the slash menu or the block menu. The plugin will generate a GPT-3 reponse using the OpenAI API and insert it beneath the block.

## OpenAI API Key

You need to [get an OpenAI API Key here](https://openai.com/api/) and add the key in the plugin settings.

## 📖 Example Use Cases

- Summarizing or explaining a block of text

<https://user-images.githubusercontent.com/2816289/172034715-21eb418d-9907-4c82-be84-84a0b82427a7.mp4>

## Creating bullet point outlines for a given topic

<https://user-images.githubusercontent.com/2816289/171097641-797e7693-2f98-47a7-aa2c-c8ae37aea888.mov>

## Creating study plan for a given topic


https://user-images.githubusercontent.com/2816289/172035502-5ac2d577-81b6-4a20-a0a8-4ece5fae9fc8.mp4



## Explain how to do something

<https://user-images.githubusercontent.com/2816289/172034726-a1f1dbbe-4194-47f8-a6f2-a2aeb2aa95ff.mp4>

## Explaining code in human-understandable english

<https://user-images.githubusercontent.com/2816289/172034736-79205599-2be5-40af-9922-f3bea7bd39cb.mp4>



https://user-images.githubusercontent.com/2816289/172035846-560e4954-13b2-40d6-97fc-7a338a586818.mp4


## Parse tabular data from plain english


https://user-images.githubusercontent.com/2816289/172035486-c320e019-c675-4c99-8a51-1ef824b9dde0.mp4



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

## Getting Started <a name = "getting_started"></a>

How to build and develop the project locally.

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
npm run dev
```

## Local Installation

First run `npm i` and `npm run build`

Open LogSeq

Go to Settings > Turn on Developer Mode

This will bring up the "Plugins" entry in three dots more menu list on top right of head bar. Go to Plugins page, and you will get a button with the  `Load unpacked plugin label`. Select the root folder of this plugin repo.

Make sure you add your [OpenAI Key](https://beta.openai.com/account/api-keys)

## 🚀 Deployment <a name = "deployment"></a>

- [ ] Add to Logseq marketplace

## Built Using <a name = "built_using"></a>

- [LogSeq](https://logseq.com/) - Privacy-first, open-source knowledge base that works on top of local plain-text Markdown and Org-mode files.
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling

## Authors <a name = "authors"></a>

- [@briansunter](https://github.com/birnaunster) - Author

## Acknowledgements <a name = "acknowledgement"></a>

- [OpenAI Examples](https://beta.openai.com/examples)
