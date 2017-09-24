const left = (string, length, spacing = " ") => {
	string = string.toString();
	if(string.length >= length) return string;
	else return spacing.repeat(length - string.length) + string;
};

module.exports = {
	process: async message => {
		const { results: info } = await process.output({
			type: "all_shards",
			input: () => ({
				id: cluster.worker.id,
				guilds: bot.guilds.size,
				memoryUsed: process.memoryUsage().heapUsed,
				streams: Array.from(bot.players.values()).filter(player => player.connection).length,
				shards: cluster.worker.shardRange.substring(7),
				uptime: Date.now() - bot.startTime
			})
		});

		const maxLen = {};
		const totalWorkers = info.length;
		maxLen.id = totalWorkers.toString().length;

		const totalGuilds = info.reduce((a, b) => a + b.guilds, 0);
		maxLen.guilds = totalGuilds.toString().length;

		const totalMemory = (info.reduce((a, b) => a + b.memoryUsed, 0) / Math.pow(1024, 3)).toFixed(2);
		maxLen.memory = Math.max(
			totalMemory.length,
			...info.map(data => (data.memoryUsed / Math.pow(1024, 3)).toFixed(2).length)
		);

		const totalStreams = info.reduce((a, b) => a + b.streams, 0);
		maxLen.streams = totalStreams.toString().length;

		const totalShards = bot.totalShards;
		maxLen.shards = Math.max(...info.map(data => data.shards.length));

		const totalUptime = bot.utils.secondsToDuration(info.reduce((a, b) => a + b.uptime, 0) / 1000);
		maxLen.uptime = totalUptime.length;

		const workerInfo = [];
		info.forEach(data => {
			let line = "";
			line += cluster.worker.id === data.id ? "* " : "  ";
			line += left(data.id, maxLen.id);
			line += ": GUILD ";
			line += left(data.guilds, maxLen.guilds);
			line += ", STREAM ";
			line += left(data.streams, maxLen.streams);
			line += ", SHARD ";
			line += left(data.shards, maxLen.shards);
			line += ", RAM ";
			line += left((data.memoryUsed / Math.pow(1024, 3)).toFixed(2), maxLen.memory);
			line += "GB, UP ";
			line += left(bot.utils.secondsToDuration(data.uptime / 1000), maxLen.uptime);

			workerInfo.push(line);
		});
		workerInfo.push(`  T: GUILD ${totalGuilds}, STREAM ${totalStreams}, SHARD ${left(totalShards, maxLen.shards)}, ` +
			`RAM ${left(totalMemory, maxLen.memory)}GB, UP ${totalUptime}`);

		return bot.utils.codeBlock(workerInfo.join("\n"), "prolog");
	},
	description: "Get info about each worker that hosts a bot"
};
