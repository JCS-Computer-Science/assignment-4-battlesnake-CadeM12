
export default function move(game){
    const gameState = game;
    const myHead = gameState.you.body[0];
    const headNode = getNodeId(myHead, gameState);
    let board = {};

    //INIT BOARD
    let c = 0;
    for(let i=0; i<gameState.board.height; i++){
        for(let j=0; j<gameState.board.width; j++){
            board[c] = {position:{x:j, y:i}, connections:[], id:c};
            c++;
        }
    }
    board = connectNodes(gameState, board);

    //PICK SNAKE STATE
    let state;
    let pathfindTo;

    let longestLength = 0;
    for(let i = 0; i < gameState.board.snakes.length; i++){
        if(gameState.board.snakes[i].id != gameState.you.id){
            if (gameState.board.snakes[i].length > longestLength){
                longestLength = gameState.board.snakes[i].length
            }
        }
    }

    //if(gameState.you.health < 30 || gameState.you.body.length < longestLength || gameState.you.body.length %2 != 0){
    //    state = 'hungry';
    //    pathfindTo = nearestFood(gameState, board, myHead, gameState.you.body[gameState.you.body.length-1]);
    //    pathfindTo = nearestFood(gameState, board, myHead, gameState.you.body[0]);
    ////} else if(gameState.board.snakes.length > 1){
    ////    state = 'hunting';
    ////    //pathfindTo = snakeHead(gameState);
    //} else {
    //    state = 'chasing';
    //    pathfindTo = getNodeId(gameState.you.body[gameState.you.body.length-1], gameState);
    //    //console.log(pathfindTo);
    //    //pathfindTo = board[headNode].connections[Math.floor(Math.random()*board[headNode].connections.length)][0];
    //}
//
    ////console.log(pathfindTo)
//
    //if((state != 'chasing') || (state == 'chasing' && !aStar(board, headNode, getNodeId(gameState.you.body[gameState.you.body.length-1], gameState)).path[1])){
    //    pathfindTo = flood(pathfindTo, headNode, board, gameState, myHead);
    //}
//
    ////console.log(pathfindTo)
//
    //if(state == 'hungry' && bfs(board, pathfindTo) < 10 && beside(myHead, gameState.you.body[gameState.you.body.length-1])){
    //    pathfindTo = getNodeId(gameState.you.body[gameState.you.body.length-1], gameState);
    //}
//
    ////console.log(pathfindTo)
//
    //let path = aStar(board, headNode, pathfindTo);
    //console.log(path, pathfindTo, state, bfs(board, pathfindTo));
//
    //if(path.cost > 50){
    //    path = aStar(board, headNode, getNodeId(gameState.you.body[gameState.you.body.length-1], gameState));
    //}
    //
    //path = path.path[1];
//
    ////IF PATH UNDEFINED THEN CHOOSE RANDOM
    //if(path == undefined){
    //    path = board[headNode].connections[Math.floor(Math.random()*board[headNode].connections.length)][0];
    //    //console.log(pathfindTo);
    //}

    pathfindTo = nearestFood(gameState, board, myHead, gameState.you.body[0]);
    pathfindTo = flood(pathfindTo, headNode, board, gameState, myHead);

    let path = aStar(board, headNode, pathfindTo);
    
    let nextMove = calculateNextMove(path.path[1], board, headNode);
    
    console.log(`MOVE ${gameState.turn}: ${nextMove}`)
    return { move: nextMove };
}

//BUILD GRAPH
//
//
function connectNodes(gameState, board){
    let snakeBodies = [];
    let snakeHeads = [];
    for(let i = 0; i < gameState.board.snakes.length; i++){
        if(gameState.board.snakes[i].id != gameState.you.id){
            for(let j = 0; j < gameState.board.snakes[i].body.length-1; j++){
                snakeBodies.push(getNodeId(gameState.board.snakes[i].body[j], gameState))
            }
            let headPoint = gameState.board.snakes[i].body[0];
            if(gameState.board.snakes[i].body.length >= gameState.you.body.length){
                snakeHeads.push(getNodeId({x: headPoint.x+1, y: headPoint.y}, gameState));
                snakeHeads.push(getNodeId({x: headPoint.x-1, y: headPoint.y}, gameState));
                snakeHeads.push(getNodeId({x: headPoint.x, y: headPoint.y+1}, gameState));
                snakeHeads.push(getNodeId({x: headPoint.x, y: headPoint.y-1}, gameState));
            }
        }
    }
    for(let i = 0; i < gameState.you.body.length-1; i++){
        snakeBodies.push(getNodeId(gameState.you.body[i], gameState));
    }

    for(let i = 0; i < (gameState.board.width * gameState.board.height); i++){
        for(let j = 0; j < (gameState.board.width * gameState.board.height); j++)
        {
            if(((board[j].position.x == board[i].position.x-1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.x == board[i].position.x+1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.y == board[i].position.y-1 && board[j].position.x == board[i].position.x) || 
            (board[j].position.y == board[i].position.y+1 && board[j].position.x == board[i].position.x)) &&
            (!snakeBodies.includes(j))){
                if(snakeHeads.includes(j)){
                    board[i].connections.push([j, 100]);
                }else{
                    board[i].connections.push([j, 1]);
                }
            };
        }
    }

    return board;
}
//
// END BUILD GRAPH

// A-STAR APTHFINDING
//
//
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
//
// END A-STAR

// NEAREST/FARTHEST
//
//

function nearestFood(gameState, board, myHead, start){
    
    let foodNodes = [];
    
    for(let i = 0; i < gameState.board.food.length; i++){
        foodNodes.push(getNodeId(gameState.board.food[i], gameState));
    }
    let safeFood = bfs(board, getNodeId(start, gameState), gameState, foodNodes);
    
    let nearest = {path: Infinity, food: undefined};
    let possible = {path:Infinity, food: undefined};
    for(let i = 0; i < safeFood.length; i++){
        let dist = aStar(board, getNodeId(myHead, gameState), safeFood[i]).path.length;
        if(dist < nearest.path && (board[safeFood[i]].connections.length >= 3 || (board[safeFood[i]].connections.length >= 1 && beside(myHead, board[safeFood[i]].position)))){
            nearest.path = dist;
            nearest.food = i;
        }
        if(dist < possible.path && board[safeFood[i]].connections.length == 2){
            possible.path = dist;
            possible.food = i;
        }
    }
    if(nearest.food != undefined){
        return safeFood[nearest.food];
    } else if(possible.food != undefined){
        return safeFood[possible.food];
    } else {
        console.log("No Food, Making Random Move");
        return board[getNodeId(myHead, gameState)].connections[Math.floor(Math.random()*board[getNodeId(myHead, gameState)].connections.length)][0];
    }
    
}

function nearestSnakeHead(gameState){
    let nearest = {path: Infinity, snake: undefined};
    for(let i = 0; i < gameState.board.snakes.length; i++){
        if(Math.sqrt(gameState.board.snakes[i].body[0].x**2 + gameState.board.snakes[i].body[0].y**2) < nearest.path){
            nearest.snake = i;
        }
    }
    
    return gameState.board.snakes[nearest.snake].id;
}

function snakeHead(gameState){
    
}

function checkEnclosure(board, headNode){
    let up = bfs(board, {x:board[headNode].position.x, y:board[headNode].position.y + 1});
    let down = bfs(board, {x:board[headNode].position.x, y:board[headNode].position.y - 1});
    let left = bfs(board, {x:board[headNode].position.x - 1, y:board[headNode].position.y});
    let right = bfs(board, {x:board[headNode].position.x + 1, y:board[headNode].position.y});

    let arr = [up, down, left, right];
    arr.sort();
    return arr[3] > 10;
}

function findClosestNodeToTail(){
    
}

//
//
// NEAREST/FARTHEST

// TOOLS
//
//

// GET NODE ID
function getNodeId(pos, gameState){
    return pos.y*gameState.board.width + pos.x;
}

// FLOOD MAP TO CHOOSE BEST DIRECTION
function flood(prevPath, headNode, board, gameState, myHead){
    let paths = [];
    for(let i = 0; i < board[headNode].connections.length; i++){
        paths.push({connection: i, space: bfs(board, board[headNode].connections[i][0])})
    };
    
    paths.sort((a, b) => b.space - a.space);
    
    let equal = true;
    for(let i = 0; i < paths.length-1; i++){
        if(paths[i+1]){
            if(paths[i].space != paths[i+1].space){
                equal = false;
            }
        }
    }

    if(!equal){
        if(paths[1]){
            if(paths[1].space == paths[0].space && board[getNodeId(myHead, gameState)].connections[paths[1].connection][0] == prevPath){
                return prevPath
            }
        }
        return board[headNode].connections[paths[0].connection][0];
    }
    return prevPath;
}

// BREADTH FIRST SEARCH FOR COUNTING SQUARES OR SEARCHING FOR TARGETS
function bfs(graph, start, gameState = undefined, targets = undefined) {
    const visited = new Set();
    const queue = [start];
    let avaliableTargets = [];
    let c = 0;
  
    while (queue.length > 0) {
      const node = queue.shift();
      
        if (!visited.has(node)) {
            c++;
            visited.add(node);
            if(targets){
                if(targets.includes(node)){
                    avaliableTargets.push(node);
                }
            }
            for (const [neighbor, cost] of graph[node].connections) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor); 
                }
            }
        }
    }
    if(targets){
        return avaliableTargets;
    }
    return c;
}

// BESIDE T/F
function beside(posA, posB){
    if((Math.abs(posA.x - posB.x) < 2 && posA.y == posB.y) || (Math.abs(posA.y - posB.y) < 2 && posA.x == posB.x)){
        return true;
    } else {
        return false;
    }
}

//FIND MOVE
function calculateNextMove(path, board, headNode){
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

//
//
// END TOOLS