const { Plugin } = require(`powercord/entities`),
	{ getModule, FluxDispatcher, messages: { deleteMessage } } = require(`powercord/webpack`),
	{ getCurrentUser } = getModule([`getCurrentUser`], false)

const TIMEOUT_PER_MESSAGE = 1000 * 60 * 10, // life time in milliseconds per message
	TIMEOUT_PER_DESTRUCT = 1000 // one delete per milliseconds after message life has expired

var queue = [],
	loop

class TimerDestruct extends Plugin {
	async startPlugin() {
		queue = []
		loop = setInterval(this.destructor, TIMEOUT_PER_DESTRUCT)
		FluxDispatcher.subscribe(`MESSAGE_CREATE`, this.collector)
	}

	collector(data) {
		if (data.message.author.id === getCurrentUser().id && data.message.member != null) {
			queue.push({ channel: data.message.channel_id, id: data.message.id, timestamp: Date.now() })
		}
	}

	destructor() {
		if (queue.length == 0) return

		const message = queue[0]
		
		if (Date.now() - message.timestamp > TIMEOUT_PER_MESSAGE) {
			queue.shift()
			deleteMessage(message.channel, message.id)
		}
	}

	pluginWillUnload() {
		FluxDispatcher.unsubscribe(`MESSAGE_CREATE`, this.collector)
		clearInterval(loop)
	}
}

module.exports = TimerDestruct
