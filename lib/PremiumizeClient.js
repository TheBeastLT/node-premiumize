'use strict'

const fs = require('fs')

const DEFAULT_TIMEOUT = 30000

class PremiumizeClient {

	constructor (token, defaultOptions = {}) {
		this.token = token
		this.defaultOptions = defaultOptions
		this.base_url = defaultOptions.base_url || 'https://www.premiumize.me/api/'
		this._initMethods()
	}

	_readFile (path) {
		return fs.createReadStream(path)
	}

	async _request (endpoint, o = {}) {
		const url = new URL(this.base_url + endpoint)
		const params = { ...o.params, apikey: this.token }
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				url.searchParams.append(key, value)
			}
		}

		const headers = { ...this.defaultOptions.headers, ...o.headers }
		let body
		if (o.form) {
			body = new URLSearchParams()
			for (const [key, value] of Object.entries(o.form)) {
				if (value !== undefined && value !== null) {
					body.append(key, value)
				}
			}
		}

		const response = await fetch(url, {
			...this.defaultOptions.fetchInit,
			method: o.method,
			headers,
			body,
			signal: AbortSignal.timeout(this.defaultOptions.timeout || DEFAULT_TIMEOUT)
		})

		const text = await response.text()
		try {
			const data = text ? JSON.parse(text) : undefined
			if (data?.status === 'error') {
				throw new Error(data.message)
			}
			if (!response.ok) {
				throw new Error(`Request failed (${response.status}): ${text.slice(0, 200)}`)
			}
			return data
		} catch (err) {
			if (err instanceof SyntaxError) {
				throw new Error(`Invalid response (${response.status}): ${text.slice(0, 200)}`)
			}
			throw err
		}
	}

	_get (endpoint, options = {}) {
		options.method = 'GET'
		return this._request(endpoint, options)
	}

	_post (endpoint, options = {}) {
		options.method = 'POST'
		return this._request(endpoint, options)
	}

	_initMethods () {
		this.folder = {
			list: (id, includebreadcrumbs = null, download_ip = null) => {
				return this._get('folder/list', {
					params: {
						id,
						includebreadcrumbs,
						download_ip
					}
				})
			},
			create: (name, parent_id = null) => {
				return this._post('folder/create', {
					form: {
						name,
						parent_id
					}
				})
			},
			rename: (id, name) => {
				return this._post('folder/rename', {
					form: {
						id,
						name
					}
				})
			},
			paste: (id, files = null, folders = null) => {
				return this._post('folder/paste', {
					form: {
						id,
						files,
						folders
					}
				})
			},
			delete: (id) => {
				return this._post('folder/delete', {
					form: {
						id
					}
				})
			},
			uploadInfo: (id) => {
				return this._get('folder/uploadinfo', {
					params: {
						id
					}
				})
			}
		}

		this.item = {
			listAll: () => {
				return this._get('item/listall')
			},
			rename: (id, name) => {
				return this._post('item/rename', {
					form: {
						id,
						name
					}
				})
			},
			delete: (id) => {
				return this._post('item/delete', {
					form: {
						id
					}
				})
			},
			details: (id) => {
				return this._get('item/details', {
					params: {
						id
					}
				})
			}
		}

		this.transfer = {
			list: () => {
				return this._get('transfer/list')
			},
			create: (src, file = null, folder_id = null) => {
				const stream = file ? (file.Readable) ? file : this._readFile(file) : null
				return this._post('transfer/create', {
					form: {
						src,
						file: stream,
						folder_id
					}
				})
			},
			directDownload: (src, download_ip = null) => {
				return this._post('transfer/directdl', {
					form: {
						src,
						download_ip
					}
				})
			},
			clearFinished: () => {
				return this._post('transfer/clearfinished')
			},
			delete: (id) => {
				return this._post('transfer/delete', {
					form: {
						id
					}
				})
			}
		}

		this.account = {
			info: () => {
				return this._get('account/info')
			}
		}

		this.zip = {
			generate: (files, folders) => {
				return this._post('zip/generate', {
					form: {
						files,
						folders
					}
				})
			}
		}

		this.cache = {
			check: (items) => {
				return this._get('cache/check', {
					params: {
						items
					}
				})
			}
		}

		this.services = {
			list: () => {
				return this._get('services/list')
			}
		}

	}

}

module.exports = PremiumizeClient
