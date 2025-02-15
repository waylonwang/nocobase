import { Database } from '../database';
import { mockDatabase } from './';
import { AdjacencyListRepository } from '../tree-repository/adjacency-list-repository';

describe('tree test', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should be auto completed', () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });
    expect(collection.treeChildrenField?.name).toBe('children');
    expect(collection.treeParentField?.name).toBe('parent');
    expect(collection.getField('parent').options.target).toBe('categories');
    expect(collection.getField('parent').options.foreignKey).toBe('parentId');
    expect(collection.getField('children').options.target).toBe('categories');
    expect(collection.getField('children').options.foreignKey).toBe('parentId');
  });

  it('should be auto completed', () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    expect(collection.treeChildrenField?.name).toBe('children');
    expect(collection.treeParentField?.name).toBe('parent');
    expect(collection.getField('parent').options.target).toBe('categories');
    expect(collection.getField('parent').options.foreignKey).toBe('cid');
    expect(collection.getField('children').options.target).toBe('categories');
    expect(collection.getField('children').options.foreignKey).toBe('cid');
  });

  const values = [
    {
      name: '1',
      __index: '0',
      children: [
        {
          name: '1-1',
          __index: '0.children.0',
          children: [
            {
              name: '1-1-1',
              __index: '0.children.0.children.0',
              children: [
                {
                  name: '1-1-1-1',
                  __index: '0.children.0.children.0.children.0',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: '2',
      __index: '1',
      children: [
        {
          name: '2-1',
          __index: '1.children.0',
          children: [
            {
              name: '2-1-1',
              __index: '1.children.0.children.0',
              children: [
                {
                  name: '2-1-1-1',
                  __index: '1.children.0.children.0.children.0',
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  it('should be tree', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const instances = await db.getRepository('categories').find({
      filter: {
        parentId: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    const instance = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);
  });

  it('should find tree collection', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const instances = await db.getRepository('categories').find({
      filter: {
        cid: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
    });

    expect(instances.map((i) => i.toJSON())).toMatchObject(values);

    const instance = await db.getRepository('categories').findOne({
      filterByTk: 1,
      tree: true,
      fields: ['id', 'name'],
    });

    expect(instance.toJSON()).toMatchObject(values[0]);
  });

  it('should get adjacency list repository', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
        },
      ],
    });

    const repository = db.getRepository('categories');
    expect(repository).toBeInstanceOf(AdjacencyListRepository);
  });

  test('performance', async () => {
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    const values = [];
    for (let i = 0; i < 10; i++) {
      const children = [];
      for (let j = 0; j < 10; j++) {
        const grandchildren = [];
        for (let k = 0; k < 10; k++) {
          grandchildren.push({
            name: `name-${i}-${j}-${k}`,
          });
        }
        children.push({
          name: `name-${i}-${j}`,
          children: grandchildren,
        });
      }

      values.push({
        name: `name-${i}`,
        description: `description-${i}`,
        children,
      });
    }

    await db.getRepository('categories').create({
      values,
    });

    const before = Date.now();

    const instances = await db.getRepository('categories').find({
      filter: {
        parentId: null,
      },
      tree: true,
      fields: ['id', 'name'],
      sort: 'id',
      limit: 10,
    });

    const after = Date.now();
    console.log(after - before);
  });
});
