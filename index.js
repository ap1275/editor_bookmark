const Sequelize = require('sequelize')
const fs = require('fs')
const Op = Sequelize.Op

const sequelize = new Sequelize(
  'database', '', '', {
  dialect: 'sqlite',
  storage: './db.sqlite3',
  logging: false,
  freezeTableName: true,
  operatorsAliases: {
    $and: Op.and,
    $or: Op.or,
    $eq: Op.eq,
    $gt: Op.gt,
    $lt: Op.lt,
    $lte: Op.lte,
    $like: Op.like
  }
})

const project = sequelize.define('project', {
  path: {type: Sequelize.TEXT, allowNull: false}
})

const bookmark = sequelize.define('bookmark', {
  project_id: {type: Sequelize.INTEGER, allowNull: true},
  line: {type: Sequelize.INTEGER, allowNull: false},
  path: {type: Sequelize.TEXT, allowNull: false},
  tag: {type: Sequelize.STRING, allowNull: true}
})

const main = f => {
  fs.access('./db.sqlite3', err => {
    if(err && err.code === 'ENOENT') {
      bookmark.sync()
      project.sync()
    }
    if(err && err.code !== 'ENOENT') console.error(err)
    else f()
  })
}

const in_project_dir = d => {
  project.findOne({where: {path: process.cwd()}}).then(p => {
    if(!p) {
      console.log('current directory has not registered as project dir')
      return
    }
    d(p)
  })
}

const exec_command = (c, e) => {
  if(process.argv[2] === c) in_project_dir(e)
}

const add_command = () => {
  exec_command('add', p => {
    bookmark.create({project_id: p.id, line: process.argv[3], path: process.argv[4], tag: process.argv[5]}).then(b => {
      if(b) console.log(`add bookmark ${p.id} ${b.line}:${b.path} ${b.tag}`)
      else console.error(`cannot insert ${b.line}:${b.path}`)
    })
  })
}

const init_command = () => {
  if(process.argv[2] === 'init') {
    project.findOrCreate({where: {path: process.cwd()}}).spread((p, c) => {
      if(c) console.log(`project init ${p.path}`)
      else console.log(`already ${p.path} exists as id:${p.id}`)
    })
  }
}

const tags_command = () => {
  exec_command('tags', () => {
    bookmark.findAll({where: {tag: process.argv[3]}}).then(p => {
      if(!p) return
      p.forEach(e => console.log(`${e.line}:${e.path}`))
    })
  })
}

const plist_command = () => {
  if(process.argv[2] === 'plist') {
    project.findAll().then(p => {
      if(!p) return
      p.forEach(e => console.log(e.path))
    })
  }
}

const list_command = () => {
  exec_command('list', () => {
    bookmark.findAll().then(p => {
      if(!p) return
      p.forEach(e => console.log(`${e.id}>${e.line}:${e.path} ${e.tag}`))
    })
  })
}

const delete_command = () => {
  exec_command('delete', () => {
    bookmark.findOne({where: {id: process.argv[3]}}).then(p => {
      if(!p) return
      p.destroy()
      console.log(`deleted ${p.id}>${p.line}:${p.path}`)
    })
  })
}

main(() => {
  init_command()
  plist_command()
  list_command()
  tags_command()
  add_command()
  delete_command()
})
