const { Sequelize, DataTypes } = require('sequelize');

class QueueService {
    constructor() {
        this.sequelize = new Sequelize('sqlite::memory:');
        this.isInit = false;
    }

    async initCheck() {
        if (!this.isInit) {
            await this.init();
        }
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
            id: {
                type: DataTypes.TEXT,
                primaryKey: true
            },
            dataArray: {
              type: DataTypes.TEXT,
              defaultValue: '[]'
            }
        });
        await this.sequelize.sync({ force: true });
        this.isInit = true;

        return this;
    }

    async getQueue(id) {
        await this.initCheck();

        const queue = await this.queue.findOrCreate({ 
            where: { id },
            defaults: {
                dataArray: '[]'
            }
        });

        return JSON.parse(queue[0].dataArray);
    }

    async setQueue(id, dataArray) {
        await this.initCheck();

        return await this.queue.update({ dataArray: JSON.stringify(dataArray) }, {
            where: { id }
        });
    }
}

const service = new QueueService();
module.exports = service;