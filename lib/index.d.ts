/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Represents the events that can be emitted by the Database class
 */
export type DBEvents<T extends object> = {
    newData: (data: T) => void | Promise<void>;
    dataDeleted: (info: {
        OriginalLength: number;
        ActualLength: number;
        Completed: boolean;
    }) => void | Promise<void>;
    error: (error: Error) => void | Promise<void>;
    connected: (info: {
        Path: string;
    }) => void | Promise<void>;
};
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
declare class Database<T extends object> extends EventEmitter {
    private _path;
    private _defaultData;
    private data;
    /**
     * Returns the data stored in the database
     */
    get _data(): T[];
    /**
     * Whether an error occurred during the last operation
     */
    errorOccurred: boolean;
    /**
     * Whether the data has been loaded from the file
     */
    dataLoaded: boolean;
    /**
     * Returns the path to the file where the data is stored
     */
    get path(): string;
    /**
     * Returns the default data that will be used when inserting new data
     */
    get defaultData(): T;
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
    constructor(_path: string, _defaultData: T);
    /**
     * @param {E} event - The name of the event to listen for
     * @param {DBEvents<T>[E]} listener - The listener function that will be called when the event is emitted
     * @template {keyof DBEvents<T>} E - The type of event to listen for
     * @returns {this} - The instance of the Database class
     * @override
     */
    on<E extends keyof DBEvents<T>>(event: E, listener: DBEvents<T>[E]): this;
    /**
     * @param {E} event - The name of the event to listen for
     * @param {DBEvents<T>[E]} listener - The listener function that will once be called when the event is emitted
     * @template {keyof DBEvents<T>} E - The type of event to listen for
     * @returns {this} - The instance of the Database class
     * @override
     */
    once<E extends keyof DBEvents<T>>(event: E, listener: DBEvents<T>[E]): this;
    /**
     * @param {E} event - The name of the event to emit
     * @param {Parameters<DBEvents<T>>[E]} args - The arguments to pass to the listener functions
     * @returns {boolean} - Whether the event was emitted successfully
     * @template {keyof DBEvents<T>} E - The type of event to emit
     * @override
     */
    emit<E extends keyof DBEvents<T>>(event: E, ...args: Parameters<DBEvents<T>[E]>): boolean;
    /**
     * Loads the data from the file into the database.
     * @async
     * @returns {Promise<void>} - A promise that resolves when the data has been loaded
     */
    private loadData;
    save(): Promise<void>;
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
    insert(data: Partial<T>): Promise<T | undefined>;
    /**
     * Gets all the data entries in the database and returns them.
     * @async
     * @returns {Promise<T[] | null>} - The data entries that were found. Null if an error occurred
     * @example
     * const data = await db.getAll();
     * console.log(data[0].Name); // John
     * console.log(data[0].ID); // 1
     */
    getAll(): Promise<T[] | null>;
    /**
     * Deletes all the data entries in the database.
     * @async
     * @returns {Promise<boolean>} - Whether the operation was successful
     * @example
     * const success = await db.deleteAll();
     * console.log(success); // true
     * console.log(await db.getAll()); // []
     */
    deleteAll(): Promise<boolean>;
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
    get(query: Partial<T>): Promise<T | undefined>;
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
    delete(query: Partial<T>): Promise<number>;
    /**
     * Determines whether data entries exist in the database that match the query.
     * @async
     * @param {Partial<T>} query - The query to search for in the database
     * @returns {Promise<boolean>} - Whether the data entries exist in the database
     * @example
     * const exists = await db.dataExists({ Name: 'John' });
     * console.log(exists); // true
     */
    dataExists(query: Partial<T>): Promise<boolean>;
    /**
     * Counts the number of data entries in the database that match the query.
     * @async
     * @param {Partial<T>} query - The query to search for in the database
     * @returns {Promise<number | undefined>} - The number of data entries that were found. Undefined if an error occurred
     * @example
     * const count = await db.countEntries({ Name: 'John' });
     * console.log(count); // 1
     */
    countEntries(query: Partial<T>): Promise<number | undefined>;
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
    scheduleTask(task: () => Promise<void>, date: Date): NodeJS.Timeout;
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
    findDistinct<K extends keyof T>(field: K): Promise<Array<T[K]> | null>;
    /**
     * Filters the data in the database using a specified filter function.
     * @async
     * @param {(entry: T) => boolean} filterFn - The filter function to use
     * @returns {Promise<T[] | undefined>} - The data entries that were found. Undefined if an error occurred
     * @example
     * const data = await db.filterData(entry => entry.Name === 'John');
     * console.log(data[0].Name); // John
     */
    filterData(filterFn: (entry: T) => boolean): Promise<T[] | undefined>;
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
    paginateData(page: number, pageSize: number): Promise<T[] | undefined>;
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
export declare function createDatabase<T extends object>(path: string, defaultData: T): Database<T>;
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
export declare function createBackup<T extends object>(db: Database<T>, backupPath: string): Promise<boolean>;
export {};
