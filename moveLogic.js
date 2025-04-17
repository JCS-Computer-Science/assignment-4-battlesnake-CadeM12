let gameStateG;
let board = {};

export default function move(gameState){
    gameStateG = gameState;

    const myHead = gameState.you.body[0];

    let c = 0;
    for(let i=0; i<gameState.board.height; i++){
        for(let j=0; j<gameState.board.width; j++){
            board[c] = {position:{x:j, y:i}, connections:[], id:c};
            c++;
        }
    }
    
    connectNodes();

    let state;
    let pathfindTo;

    if(gameState.you.health < 50 || gameState.you.body.length < 7){
        state = 'hungry';
        pathfindTo = nearestFood();
    } else if(gameState.board.snakes.length > 1){
        state = 'hunting';
        pathfindTo = snakeHead(nearestSnakeHead());
    } else {
        state = 'chilling';
        pathfindTo = board[getNodeId(myHead)].connections[Math.floor(Math.random()*board[getNodeId(myHead)].connections.length)][0];
        console.log(pathfindTo);
    }

    let path = aStar(board, getNodeId(myHead), pathfindTo).path[1];

    let nextMove = calculateNextMove(path);
    
    console.log(`MOVE ${gameState.turn}: ${nextMove}`)
    return { move: nextMove };
}

function connectNodes(){
    let snakeBodies = [];
    let avoid = [];
    for(let i = 0; i < gameStateG.board.snakes.length; i++){
        for(let j = 0; j < gameStateG.board.snakes[i].body.length; j++){
            snakeBodies.push(getNodeId(gameStateG.board.snakes[i].body[j]))
        }
    }
    for(let i = 0; i < gameStateG.you.body.length; i++){
        snakeBodies.push(getNodeId(gameStateG.you.body[i]));
    }

    for(let i = 0; i < (gameStateG.board.width * gameStateG.board.height); i++){
        for(let j = 0; j < (gameStateG.board.width * gameStateG.board.height); j++)
        {
            if(((board[j].position.x == board[i].position.x-1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.x == board[i].position.x+1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.y == board[i].position.y-1 && board[j].position.x == board[i].position.x) || 
            (board[j].position.y == board[i].position.y+1 && board[j].position.x == board[i].position.x)) &&
            (!snakeBodies.includes(j))){
                if(avoid.includes(j)){
                    board[i].connections.push([j, 40]);
                } else {
                    board[i].connections.push([j, 1]);
                }
            };
        }
    }
}

function aStar(graph, start, target){
    let openSet = [{ node: start, f: 0, path: [start] }];
    let gScores = { [start]: 0 };

    while (openSet.length > 0) {

        openSet.sort((a, b) => a.f - b.f);
        let current = openSet.shift();
        
        if (current.node === target) {
            return { path: current.path, cost: gScores[target] };
        };
        
        for (let [neighbor, cost] of graph[current.node].connections) {
            let tentativeG = gScores[current.node] + cost;

            
            if (!(neighbor in gScores) || tentativeG < gScores[neighbor]) {
                gScores[neighbor] = tentativeG;
                let fScore = tentativeG + heuristic(neighbor, target, graph);
                openSet.push({ node: neighbor, f: fScore, path: [...current.path, neighbor] });
            };
        };
    };
    
    return { path: [], cost: Infinity };
};

function heuristic(start, target, nodes){
    if(start != null && target != null){
        return (Math.abs(nodes[start].position.x - nodes[target].position.x) + Math.abs(nodes[start].position.y - nodes[target].position.y));
    } else {
        return Infinity;
    };
};

function getNodeId(pos){
    return pos.y*gameStateG.board.width + pos.x;
}

function nearestFood(){
    let nearest = {path: Infinity, food: undefined};
    for(let i = 0; i < gameStateG.board.food.length; i++){
        let dist = Math.sqrt((gameStateG.board.food[i].x - gameStateG.you.body[0].x)**2 + (gameStateG.board.food[i].y - gameStateG.you.body[0].y)**2)
        if(dist < nearest.path && board[getNodeId(gameStateG.board.food[i])].connections.length >= 3){
            nearest.path = dist;
            nearest.food = i;
        }
    }
    return getNodeId(gameStateG.board.food[nearest.food]);
}

function nearestSnakeHead(){
    let nearest = {path: Infinity, snake: undefined};
    for(let i = 0; i < gameStateG.board.snakes.length; i++){
        if(Math.sqrt(gameStateG.board.snakes[i].body[0].x**2 + gameStateG.board.snakes[i].body[0].y**2) < nearest.path){
            nearest.snake = i;
        }
    }

    return gameStateG.board.snakes[nearest.snake].id;
}

function snakeHead(){

}

function calculateNextMove(path){
    let headNode = getNodeId(gameStateG.you.body[0]);
    console.log([path, headNode])
    if(board[path].position.x == board[headNode].position.x-1){
        return "left"
    }
    if(board[path].position.x == board[headNode].position.x+1){
        return "right"
    }
    if(board[path].position.y == board[headNode].position.y-1){
        return "down"
    }
    if(board[path].position.y == board[headNode].position.y+1){
        return "up"
    }
}