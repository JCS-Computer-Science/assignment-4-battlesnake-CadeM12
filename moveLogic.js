let gameStateG;
let board = {};
let moveSafety;

export default function move(gameState){
    gameStateG = gameState;

    moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    
    // We've included code to prevent your Battlesnake from moving backwards
    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    
    if (myNeck.x < myHead.x || myHead.x == 0) {        // Neck is left of head, don't move left
        moveSafety.left = false;
        
    } 
    if (myNeck.x > myHead.x || myHead.x == gameState.board.width-1) { // Neck is right of head, don't move right
        moveSafety.right = false;
        
    } 
    if (myNeck.y < myHead.y || myHead.y == 0) { // Neck is below head, don't move down
        moveSafety.down = false;
        
    } 
    if (myNeck.y > myHead.y || myHead.y == gameState.board.height-1) { // Neck is above head, don't move up
        moveSafety.up = false;
    }
    
    // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
    // gameState.board contains an object representing the game board including its width and height
    // https://docs.battlesnake.com/api/objects/board

    //console.log(gameState.board);

    let c = 0;
    for(let i=0; i<gameState.board.height; i++){
        for(let j=0; j<gameState.board.width; j++){
            board[c] = {position:{x:j, y:i}, connections:[], id:c};
            c++;
        }
    }
    
    connectNodes();

    let path = aStar(board, getNodeId(myHead), getNodeId(gameState.board.food[0])).path[1] ?? board[getNodeId(myHead)].connections[Math.floor(Math.random(board[getNodeId(myHead)].connections.length))][0]

    //console.log(aStar(board, getNodeId(myHead), getNodeId(gameState.board.food[0])).path[0])
    //console.log(board[getNodeId(myHead)].connections[Math.floor(Math.random(board[getNodeId(myHead)].connections.length))][0])
    //console.log(path);
    let nextMove = calculateNextMove(path);

    // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
    // gameState.you contains an object representing your snake, including its coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    
    
    // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
    // gameState.board.snakes contains an array of enemy snake objects, which includes their coordinates
    // https://docs.battlesnake.com/api/objects/battlesnake
    
    // Are there any safe moves left?
    
    //Object.keys(moveSafety) returns ["up", "down", "left", "right"]
    //.filter() filters the array based on the function provided as an argument (using arrow function syntax here)
    //In this case we want to filter out any of these directions for which moveSafety[direction] == false
    const safeMoves = Object.keys(moveSafety).filter(direction => moveSafety[direction]);
    if (safeMoves.length == 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
        return { move: "down" };
    }
    
    // Choose a random move from the safe moves
    //const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    //console.log([board, getNodeId(myHead), getNodeId(gameState.board.food[0])]);
    //console.log(aStar(board, getNodeId(myHead), getNodeId(gameState.board.food[0])));

    // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
    // gameState.board.food contains an array of food coordinates https://docs.battlesnake.com/api/objects/board
    
    console.log(`MOVE ${gameState.turn}: ${nextMove}`)
    return { move: nextMove };
}

function connectNodes(){
    let snakeBodies = [];
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
            if(((board[j].position.x == board[i].position.x-1 && board[j].position.y == board[i].position.y && moveSafety.left) || (board[j].position.x == board[i].position.x+1 && board[j].position.y == board[i].position.y && moveSafety.right) || (board[j].position.y == board[i].position.y-1 && board[j].position.x == board[i].position.x && moveSafety.up) || (board[j].position.y == board[i].position.y+1 && board[j].position.x == board[i].position.x && moveSafety.down))&&(!snakeBodies.includes(j))){
                board[i].connections.push([j, 1]);
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
        //console.log(current);
        //console.log(current.node)
        //console.log(graph[current.node].connections);
        
        for (let [neighbor, cost] of graph[current.node].connections) {
            let tentativeG = gScores[current.node] + cost;

            
            if (!(neighbor in gScores) || tentativeG < gScores[neighbor]) {
                gScores[neighbor] = tentativeG;
                let fScore = tentativeG + heuristic(neighbor, target, graph);
                openSet.push({ node: neighbor, f: fScore, path: [...current.path, neighbor] });
            };
        };
    };
    
    // If no path is found
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