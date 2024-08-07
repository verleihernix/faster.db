# FastDB
>**An easy-to-use, fast, async-ready Database handler for Node.JS**

## Features
- Insert, update, delete, and retrieve data entries.
- Supports custom events for data insertion, deletion, and errors.
- Type-safe operations with TypeScript.
- Automatically loads and saves data to a file.
- Handles errors gracefully and emits appropriate events.

## Getting Started

### Prerequisites
- Node.js (>=14.x)
- TypeScript (>=4.x)

### Installation
```sh
npm install faster.db
```

### Usage (Typescript)
```ts
import { createDatabase } from 'faster.db';

type User = {
  Name: string;
  ID: number;
};

const db = createDatabase<User>('user-database', { Name: '', ID: 0 });

db.on('error', (err) => {
  console.error('Database error:', err);
});

(async () => {
  const user = await db.insert({ Name: 'John', ID: 1 });
  console.log('Inserted user:', user);

  const exists = await db.dataExists({ Name: 'John' });
  console.log('User exists:', exists);

  const allUsers = await db.getAll();
  console.log('All users:', allUsers);

  const deletedCount = await db.delete({ Name: 'John' });
  console.log('Deleted users count:', deletedCount);
})();
```

### Usage (JavaScript)
```js
const { createDatabase } = require('faster.db');

const db = createDatabase('user-database', { Name: String, ID: Number });

db.on('error', (err) => {
  console.error('Database error:', err);
});

(async () => {
  const user = await db.insert({ Name: 'John', ID: 1 });
  console.log('Inserted user:', user);

  const exists = await db.dataExists({ Name: 'John' });
  console.log('User exists:', exists);

  const allUsers = await db.getAll();
  console.log('All users:', allUsers);

  const deletedCount = await db.delete({ Name: 'John' });
  console.log('Deleted users count:', deletedCount);
})();
```