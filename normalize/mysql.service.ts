import { createConnection, Connection as MysqlConnection } from 'mysql';

export class MysqlService {
    public mysqlConnection: MysqlConnection;
    public options: any;

    constructor(options) {
        this.options = options;
    }

    public async createDatabaseConnection(): Promise<void> {
        console.log('Starting MySQL connection')
        if (!this.options) {
            throw new Error('No connection details provided to Services');
        } else if (!this.options.mysql) {
            throw new Error('No connection options provided for MySQL');
        }
        const mysqlConnection: MysqlConnection = await createConnection(this.options.mysql);
        mysqlConnection.connect();
        console.log('MySQL connected');
        if (mysqlConnection) {
            this.mysqlConnection = mysqlConnection;
        } else {
            throw new Error(`Unable to connection to database: ${this.options.mysql}`);
        }
    }

    public async query(query: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.mysqlConnection.query(query, params, (error, results) => {
                if (error) {
                    return reject(error);
                }
                return resolve(results);
            });
        });
    }

    public async close(): Promise<void> {
        if (this.mysqlConnection) {
            await this.mysqlConnection.end();
        }
    }
}