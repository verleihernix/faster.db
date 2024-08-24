import { readFile, writeFile } from 'fs/promises';
import { EventEmitter } from "events";

/**
 * Represents the events that can be emitted by the Database class
 */
export type DBEvents<T extends object> = {
    newData: (data: T) => void | Promise<void>;
    dataDeleted: (info: { OriginalLength: number, ActualLength: number, Completed: boolean }) => void | Promise<void>;
    error: (error: Error) => void | Promise<void>;
    connected: (info: { Path: string }) => void | Promise<void>;
}

/**
 * Represents a database that stores data of a specific type.
 * @class
 * @extends EventEmitter
 * @template  T - The type of data that the database will store
 * @example
 * const db = new Database('user-database', { Name: String, ID: Number });
 * db.on('error', (err) => {
 *    console.log(err);
 * });
 * (async () => {
 *   if (await db.dataExists({ Name: 'John' })) {
 *      await db.delete({ Name: 'John' });
 *  } else {
 *     await db.insert({ Name: 'John', ID: 1 });
 * })();
 */
class Database<T extends object> extends EventEmitter {
    #data: T[] = [];
    /**
     * Returns the data stored in the database
     */
    public get data (): T[] {
        return this.#data;
    }
    /**
     * Whether an error occurred during the last operation
     */
    public errorOccurred: boolean = false;
    /**
     * Whether the data has been loaded from the file
     */
    public dataLoaded: boolean = false;

    /**
     * Returns the path to the file where the data is stored
     */
    public get path (): string {
        return this.path;
    }

    /**
     * Returns the default data that will be used when inserting new data
     */
    public get defaultData (): T {
        return this.defaultData;
    }

    /**
     * Creates a new instance of the Database class.
     * @param {string} _path - The path to the file where the data will be stored 
     * @param {T} _defaultData - The default data that will be used when inserting new data
     * @constructor
     * @example
     * const db = new Database('user-database', { Name: String, ID: Number });
     * db.on('error', (err) => {
     *   console.log(err);
     * });
     * (async () => {
     *  if (await db.dataExists({ Name: 'John' })) {
     *   await db.delete({ Name: 'John' })
     * } else {
     *  await db.insert({ Name: 'John', ID: 1 });
     * })(); 
     */
    constructor(private _path: string, private _defaultData: T) {
        super();
        if (!_path.endsWith('.fastdb')) {
            this._path = `${_path}.fastdb`;
        }
    }

    /**
     * @param {E} event - The name of the event to listen for 
     * @param {DBEvents<T>[E]} listener - The listener function that will be called when the event is emitted 
     * @template {keyof DBEvents<T>} E - The type of event to listen for
     * @returns {this} - The instance of the Database class
     * @override
     */
    public override on<E extends keyof DBEvents<T>>(event: E, listener: DBEvents<T>[E]): this {
        return super.on(event, listener);
    }

    /**
     * @param {E} event - The name of the event to listen for 
     * @param {DBEvents<T>[E]} listener - The listener function that will once be called when the event is emitted 
     * @template {keyof DBEvents<T>} E - The type of event to listen for
     * @returns {this} - The instance of the Database class
     * @override
     */
    public override once<E extends keyof DBEvents<T>>(event: E, listener: DBEvents<T>[E]): this {
        return super.once(event, listener);
    }

    /**
     * @param {E} event - The name of the event to emit
     * @param {Parameters<DBEvents<T>>[E]} args - The arguments to pass to the listener functions 
     * @returns {boolean} - Whether the event was emitted successfully
     * @template {keyof DBEvents<T>} E - The type of event to emit
     * @override
     */
    public override emit<E extends keyof DBEvents<T>>(event: E, ...args: Parameters<DBEvents<T>[E]>): boolean {
        return super.emit(event, ...args);
    }

    /**
     * Loads the data from the file into the database.
     * @async
     * @returns {Promise<void>} - A promise that resolves when the data has been loaded
     */
    private async loadData(): Promise<void> {
        if (!this.dataLoaded) {
            try {
                const fileContent = await readFile(this._path, 'utf-8');
                this.#data = JSON.parse(fileContent);
                this.dataLoaded = true;
                this.emit('connected', { Path: this._path });
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    this.#data = [];
                    await this.save();
                } else {
                    throw error;
                }
            }
        }
    }

    public async save(): Promise<void> {
        await writeFile(this._path, JSON.stringify(this.data, null, 2));
    }


    /**
     * Inserts a new data entry into the database. 
     * @async
     * @param {Partial<T>} data - The data to insert into the database
     * @returns {Promise<T | undefined>} - The data that was inserted into the database. Undefined if an error occurred
     * @example
     * const data = await db.insert({ Name: 'John', ID: 1 });
     * console.log(data.Name); // John
     * console.log(data.ID); // 1
     */
    public async insert(data: Partial<T>): Promise<T | undefined> { 
        try {
            await this.loadData();
            if (!data) {
                this.emit('error', new Error('Data to insert cannot be empty'));
                return undefined;
            }
            const newEntry = {...this._defaultData, ...data};
            this.data.push(newEntry);
            await this.save();
            this.emit('newData', newEntry);
            return newEntry;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return undefined;
        }
    }

    /**
     * Gets all the data entries in the database and returns them.
     * @async
     * @returns {Promise<T[] | null>} - The data entries that were found. Null if an error occurred
     * @example
     * const data = await db.getAll();
     * console.log(data[0].Name); // John
     * console.log(data[0].ID); // 1
     */
    public async getAll(): Promise<T[] | null> {
        try {
            await this.loadData();
            return this.data;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return null;
        }
    }

    /**
     * Deletes all the data entries in the database.
     * @async
     * @returns {Promise<boolean>} - Whether the operation was successful
     * @example
     * const success = await db.deleteAll();
     * console.log(success); // true
     * console.log(await db.getAll()); // []
     */
    public async deleteAll(): Promise<boolean> {
        try {
            await this.loadData();
            const originalLength = this.data.length;
            this.#data = [];
            await this.save();
            this.emit('dataDeleted', { OriginalLength: originalLength, ActualLength: 0, Completed: true });
            return true;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return false;
        }
    }

    /**
     * Gets a single data entry in the database that matches the query and returns it.
     * @async
     * @param {Partial<T>} query - The query to search for in the database 
     * @returns {Promise<T | undefined>} - The data entry that was found. Undefined if an error occurred
     * @example
     * const data = await db.get({ Name: 'John' });
     * console.log(data.Name); // John
     * console.log(data.ID); // 1
     */
    public async get(query: Partial<T>): Promise<T | undefined> {
        try {
            await this.loadData();
            if (!query) {
                this.emit('error', new Error('Cannot search for an empty query'));
                return undefined;
            }
            return this.data.find(entry => {
                for (const key in query) {
                    if (query[key] !== entry[key]) {
                        return false;
                    }
                }
                return true;
            });
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return undefined;
        }
    }

    /**
     * Deletes data entries in the database that match the query.
     * @async
     * @param {Partial<T>} query - The query to search for in the database 
     * @returns {Promise<number>} - The number of data entries that were deleted
     * @example
     * const count = await db.delete({ Name: 'John' });
     * console.log(count); // 1
     * console.log(await db.getAll()); // []
     */
    public async delete(query: Partial<T>): Promise<number> {
        try {
            await this.loadData();
            if (!query || Object.keys(query).length === 0) {
                throw new Error('Cannot delete with an empty query');
            }

            const originalLength = this.data.length;
            this.#data = this.data.filter(entry => {
                for (const key in query) {
                    if (query[key] !== entry[key]) {
                        return true;
                    }
                }
                return false;
            });

            const deletedCount = originalLength - this.data.length;

            await this.save();
        
            this.emit('dataDeleted', { 
                OriginalLength: originalLength, 
                ActualLength: this.data.length, 
                Completed: true 
            });

            return deletedCount;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return 0;
        }
    }

    /**
     * Determines whether data entries exist in the database that match the query.
     * @async
     * @param {Partial<T>} query - The query to search for in the database
     * @returns {Promise<boolean>} - Whether the data entries exist in the database
     * @example
     * const exists = await db.dataExists({ Name: 'John' });
     * console.log(exists); // true
     */
    public async dataExists(query: Partial<T>): Promise<boolean> {
        try {
            await this.loadData();

            if (!query || Object.keys(query).length === 0) {
                throw new Error('Cannot check existence with an empty query');
            }

            return this.data.some(entry => {
                for (const key in query) {
                    if (query[key] !== entry[key]) {
                        return false;
                    }
                }
                return true;
            });
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return false;
        }
    }

    /**
     * Counts the number of data entries in the database that match the query.
     * @async
     * @param {Partial<T>} query - The query to search for in the database 
     * @returns {Promise<number | undefined>} - The number of data entries that were found. Undefined if an error occurred
     * @example
     * const count = await db.countEntries({ Name: 'John' });
     * console.log(count); // 1
     */
    public async countEntries(query: Partial<T>): Promise<number | undefined> {
        if (!query || Object.keys(query).length === 0) {
            throw new Error('Cannot count entries with an empty query');
        }
        try {
            await this.loadData();
            return this.data.filter(entry => {
                for (const key in query) {
                    if (query[key] !== entry[key]) {
                        return false;
                    }
                }
                return true;
            }).length;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return undefined;
        }
    }

    /**
     * Schedules a specified task to run at a specified time and execute a database operation.
     * @param {() => Promise<void>} task - The task to perform on the database
     * @param {Date} date - When the task should be executed
     * @returns {NodeJS.Timeout} - The timeout object that can be used to cancel the task
     * @example
     * db.scheduleTask(async () => {
     * await db.insert({ Name: 'John', ID: 1 });
     * }, new Date('2025-12-17T03:24:00'));
     * console.log(await db.getAll()); // []
     */
    public scheduleTask(task: () => Promise<void>, date: Date): NodeJS.Timeout {
        const now = new Date(); 
        const delay = date.getTime() - now.getTime();
        if (delay < 0) {
            throw new Error('Scheduled time must be in the future.');
        }
        return setTimeout(async () => {
            try {
                await task();
            } catch (error) {
                this.emit('error', error as Error);
            }
        }, delay);
    }

    /**
     * Finds distinct values for a specified field in the database.
     * @async
     * @param {K} field - The field to find distinct values for
     * @template K - The type of field to find distinct values for
     * @returns {Promise<Array<T[K]> | null>} - The distinct values that were found. Null if an error occurred  
     * @example
     * const values = await db.findDistinct('Name');
     * console.log(values); // ['John', 'Jane'];
     */
    public async findDistinct<K extends keyof T>(field: K): Promise<Array<T[K]> | null> {
        if (!field) {
            throw new Error('Field to find distinct values for cannot be empty');
        }
        try {
            await this.loadData();
            const data = await this.getAll();
            if (data) {
                const values = data.map(entry => entry[field]);
                return Array.from(new Set(values));
            }
            return null;
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return null;
        }
    }

    /**
     * Filters the data in the database using a specified filter function.
     * @async
     * @param {(entry: T) => boolean} filterFn - The filter function to use 
     * @returns {Promise<T[] | undefined>} - The data entries that were found. Undefined if an error occurred
     * @example
     * const data = await db.filterData(entry => entry.Name === 'John');
     * console.log(data[0].Name); // John
     */
    public async filterData(filterFn: (entry: T) => boolean): Promise<T[] | undefined> {
        if (!filterFn) {
            throw new Error('Filter function cannot be empty');
        }
        try {
            await this.loadData();
            return this.data.filter(filterFn);
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return undefined;
        }
    }

    /**
     * Paginates the data in the database and returns a specified number of data entries.
     * @async
     * @param {number} page - The page number to retrieve
     * @param {number} pageSize - The number of data entries to retrieve per page
     * @returns {Promise<T[] | undefined>} - The data entries that were found. Undefined if an error occurred
     * @example
     * const data = await db.paginateData(1, 1);
     * console.log(data[0].Name); // John
     */
    public async paginateData(page: number, pageSize: number): Promise<T[] | undefined> {
        if (!page || !pageSize || page < 1 || pageSize < 1) {
            throw new Error('Invalid parameters for pagination');
        }
        try {
            await this.loadData();
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            return this.data.slice(start, end);
        } catch (error) {
            this.emit('error', error as Error);
            this.errorOccurred = true;
            return undefined;
        }
    }

}

/**
 * Creates a new instance of the Database class.
 * @param {string} path - The path to the file where the data will be stored 
 * @param {T} defaultData - The default data that will be used when inserting new data
 * @returns {Database<T>} - The instance of the Database class
 * @template T - The type of data that the database will store
 * @example
 * const db = createDatabase('user-database', { Name: String, ID: Number });
 * db.on('error', (err) => {
 *  console.log(err);
 * });
 * (async () => {
 * if (await db.dataExists({ Name: 'John' })) {
 * await db.delete({ Name: 'John' });
 * } else {
 * await db.insert({ Name: 'John', ID: 1 });
 * })();
 */
export function createDatabase<T extends object>(path: string, defaultData: T): Database<T> {
    return new Database(path, defaultData);
}


/**
 * Creates a backup of the database data. 
 * @param {Database<T>} db - The database to create a backup of 
 * @param {string} backupPath - The path to save the backup file 
 * @template T - The type of data that the database stores
 * @returns {Promise<boolean>} - Whether the backup was created successfully
 * @example
 * const success = await createBackup(db, 'backup.json');
 * console.log(success); // true
 */
export async function createBackup<T extends object>(db: Database<T>, backupPath: string): Promise<boolean> {
    if (!db || !backupPath) {
        throw new Error('Missing one or more required arguments');
    }
    try {
        if (!backupPath.endsWith('.fastdb-backup')) {
            backupPath = `${backupPath}.fastdb-backup`;
        }
        if (db.dataLoaded) {
            const data = await db.getAll();
            await writeFile(backupPath, JSON.stringify(data, null, 2));
            return true;
        } else {
            throw new Error('Database data not loaded');
        }
    } catch (error) {
        throw error;
    }
}