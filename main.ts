/*****************************************************************************
* 
*   Codingame - Code vs Zombies
*   @author Marc <marcandre@ploux.fr>
*
******************************************************************************/


const MAX_GAME_SIZE = 20000

const PLAYER_SPEED = 1000
const ZOMBIE_SPEED = 400
const PLAYER_KILL_RADIUS = 2000
const ZOMBIE_KILL_RADIUS = 400


//-----------------------------------------------------------------------------
// TYPES
//-----------------------------------------------------------------------------

type Target = {
    entity: Entity
    distance: number
}

type PlayerDataType = {
    pos: Vec2
}

type HumanDataType = {
    id: number
    pos: Vec2 
}

type ZombieDataType = {
    id: number
    pos: Vec2
    next: Vec2
}


//-----------------------------------------------------------------------------
// GAME
//-----------------------------------------------------------------------------

class Game {
    
    player: Player
    humans: Human[]
    zombies: Zombie[]

    update(p: Player, h: Human[], z: Zombie[]) {

        // Update data
        this.player = p
        this.humans = h
        this.zombies = z

        // Update entities
        h.forEach(hh => { hh.update(this) })
        z.forEach(zz => { zz.update(this) })
        p.update(this)

        // Submit target position
        console.log(p.targetPos.str())
    }

    closestEntity({ to, from }: 
        { to: Entity, from: Entity[] }): Target {
        
        let distance = MAX_GAME_SIZE
        let entity: Entity = null
        
        from.forEach(e => {
            const dist = to.pos.dist(e.pos)
            if (dist < distance) {
                distance = dist
                entity = e
            }
        })

        return { entity: entity, distance: distance }
    }
}

const game = new Game()


//-----------------------------------------------------------------------------
// ENTITIES
//-----------------------------------------------------------------------------

abstract class Entity {

    id: number
    pos: Vec2
    game: Game

    abstract update(game: Game): void
    abstract str(): void
    abstract debug(): void
}

/**
 * Player entity
 */
class Player extends Entity {

    targetPos: Vec2

    constructor(params: PlayerDataType) {
        
        super()
        Object.assign(this, params)
        this.targetPos = new Vec2(0, 0)
    }

    update(game: Game) {
        
        this.game = game

        const closestZombie = 
            game.closestEntity({ to: this, from: this.game.zombies })

        const closestSavableHuman = this.closestSavableHuman

        if (closestZombie.distance < closestSavableHuman.distance)
            this.goto(closestZombie.entity.pos)
        else
            this.goto(closestSavableHuman.entity.pos)
    }

    get closestSavableHuman() {

        let distance = MAX_GAME_SIZE
        let entity: Human = null

        this.game.humans.forEach(h => {
            const zombieDist = h.closestZombie.distance
            const savable = this.isHumanSavable(h)

            if (zombieDist < distance && savable) {
                distance = zombieDist
                entity = h
            }
        })

        return { entity: entity, distance: distance }
    }

    isHumanSavable(human: Human) {

        const humanDeathTime = 
            human.closestZombie.distance / ZOMBIE_SPEED

        const humanRescueTime = 
            (this.pos.dist(human.pos) - PLAYER_KILL_RADIUS) / PLAYER_SPEED

        return humanDeathTime >= humanRescueTime
    }

    goto(pos: Vec2) { this.targetPos = pos }

    str = () => 'pos: ' + this.pos.str()
    debug = () => console.error(this.str())
}

/**
 * Human entity
 */
class Human extends Entity {

    constructor(params: HumanDataType) {

        super()
        Object.assign(this, params)
    }

    update(game: Game) {

        this.game = game
    }

    get closestZombie(): Target {

        return this.game.closestEntity({ 
            to: this, 
            from: game.zombies 
        })
    }

    str = () => 
        'id: ' + this.id + '		' +
        'pos: ' + this.pos.str()
    debug = () => console.error(this.str())
}


/**
 * Zombie entity
 */
class Zombie extends Entity {

    next: Vec2

    constructor(params: ZombieDataType) {

        super()
        Object.assign(this, params)
    }

    update(game: Game) { 

        this.game = game
    }

    get target(): Target {

        return this.game.closestEntity({ 
            to: this, 
            from: game.humans 
        })
    }

    str = () => 
        'id: ' + this.id + '		' +
        'pos: ' + this.pos.str() + '		' +
        'next: ' + this.pos.str()
    debug = () => console.error(this.str())
}


//-----------------------------------------------------------------------------
// MATHS
//-----------------------------------------------------------------------------

class Vec2 {

    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    add = (v: Vec2) => new Vec2(this.x + v.x, this.y + v.y)
    sub = (v: Vec2) => new Vec2(this.x - v.x, this.y - v.y)
    mul = (v: Vec2) => new Vec2(this.x * v.x, this.y * v.y)
    div = (v: Vec2) => new Vec2(this.x / v.x, this.y / v.y)
    mag = () => Math.sqrt(this.x * this.x + this.y * this.y)
    norm = () => new Vec2(this.x / this.mag(), this.y / this.mag())
    dist = (v: Vec2) => this.sub(v).mag()

    str = () => this.x + ' ' + this.y
    debug = () => console.error(this.str())
}


//-----------------------------------------------------------------------------
// SETUP - Messy
//-----------------------------------------------------------------------------

while (true) {

    let player: Player
    let humans: Human[] = []
    let zombies: Zombie[] = []

    var inputs: string[] = readline().split(' ');
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]);
    
    const humanCount: number = parseInt(readline());
    for (let i = 0; i < humanCount; i++) {
        var inputs: string[] = readline().split(' ');
        const id: number = parseInt(inputs[0]);
        const x: number = parseInt(inputs[1]);
        const y: number = parseInt(inputs[2]);

        humans.push(new Human({
            id: id, 
            pos: new Vec2(x, y)
        }))
    }

    const zombieCount: number = parseInt(readline());
    for (let i = 0; i < zombieCount; i++) {
        var inputs: string[] = readline().split(' ');
        const id: number = parseInt(inputs[0]);
        const x: number = parseInt(inputs[1]);
        const y: number = parseInt(inputs[2]);
        const nextX: number = parseInt(inputs[3]);
        const nextY: number = parseInt(inputs[4]);

        zombies.push(new Zombie({
            id: id, 
            pos: new Vec2(x, y),
            next: new Vec2(nextX, nextY)
        }))
    }

    if (!player) {
        player = new Player({ 
            pos: new Vec2(x, y)
        })
    }
    else {
        player.pos.x = x
        player.pos.y = y
    }

    game.update(
        player, 
        humans, 
        zombies
    )
}
