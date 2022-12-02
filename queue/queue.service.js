const { Sequelize } = require('sequelize');

class QueueService {
    constructor() {
        this.sequelize = new Sequelize('sqlite::memory:');
    }

    async init() {
        this.sequelize.authenticate()
            .then(() => {
                console.log('Connection has been established successfully.');
            })
            .catch((error) => {
                console.error('Unable to connect to the database:', error);
            });
        this.queue = this.sequelize.define("queue", {
            id: DataTypes.TEXT,
            dataArray: {
              type: DataTypes.TEXT,
              defaultValue: '[]'
            }
        });
        await this.sequelize.sync({ force: true });
    }

    async getQueue(id) {
        const queue = await this.queue.findOrCreate({ 
            where: { id },
            defaults: {
                dataArray: '[]'
            }
        });

        return JSON.parse(queue[0].dataArray);
    }

    async setQueue(id, dataArray) {
        return await this.queue.update({ dataArray: JSON.stringify(dataArray) }, {
            where: { id }
        });
    }
}

const service = new QueueService();
await service.init();

module.exports = service;