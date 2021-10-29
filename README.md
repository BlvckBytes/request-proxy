# request-proxy

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Run HTTP(S) requests through this proxy to avoid CORS browser issues when directly calling APIs in the frontend.

## Table of Contents
* [Installation](#installation)
* [How to Use](#how-to-use)
* [Configuration](#configuration)
  * [Common Settings](#common-settings)
  * [Users](#users)

## Installation

Just clone this repo, install the dependencies, build and run!

```bash
git clone https://github.com/BlvckBytes/request-proxy.git
cd request-proxy
yarn install
yarn run build
yarn run start
```

## How to Use

This service listens to *all* HTTP-Methods on `/proxy`, which will then be relayed on to the target. You need to provide three query parameters, just like this:

```
?username=youruser&password=yourpassword&url=https://google.com
```

Username and password are pretty self explandatory, and the URL is processed and executed like this:

* ✅ A request is issued to the full URL, supporting HTTP and HTTPS fully
* ✅ Path- and query-parameters have to be on the URL itself, not root
* ✅ Headers like `Authorization` or others are attached to the request
* ✅ The method that is dispatched on `/proxy` is dispatched on the `url`
* ✅ The body is attached as is, supporting all types (binary, json, ...)

## Configuration

Within the `src/` directory, you'll find a `config.ini`.

### Common Settings

```ini
[settings]
letsEncryptDir=/etc/letsencrypt/live/blvckbytes.dev
```

`letsEncryptDir` needs to point to your lets-encrypt live folder regarding the domain you're looking to attach this gateway to. If you're not using lets-encrypt, either adjust the code, or just create a folder with sym-links having the required filenames.

### Users

```ini
[users]
; username=password
youruser=yourpassword
```

Within the `users` region, every line is a user that can authenticate with the username (key) and password (value). Usernames are handled *ignore-case*.