
export default function move(game){
    const gameState = game;
    const myHead = gameState.you.body[0];
    const headNode = getNodeId(myHead, gameState);
    let board = {};
    let hazards = [];

    if(gameState.board.hazards){
        for(let i = 0; i < gameState.board.hazards.length; i++){
            hazards.push(getNodeId(gameState.board.hazards[i], gameState));
        }
    }

    //console.log(gameState.board.snakes);

    //INIT BOARD
    let c = 0;
    for(let i=0; i<gameState.board.height; i++){
        for(let j=0; j<gameState.board.width; j++){
            board[c] = {position:{x:j, y:i}, connections:[], id:c};
            c++;
        }
    }
    board = connectNodes(gameState, board);

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

    pathfindTo = nearestFood(gameState, board, myHead, gameState.you.body[0]);

    if((gameState.you.health > 40 && gameState.you.body.length > longestLength + 1) && !(hazards.length > 0)){
        console.log("Hunting")
        pathfindTo = huntSnake(gameState, board, headNode);
    }

    if(gameState.you.health > 40 && gameState.you.body.length >= 20){
        pathfindTo = huntSnake(gameState, board, getNodeId(gameState.you.body[gameState.you.body.length-1], gameState));
    }

    pathfindTo = flood(pathfindTo, headNode, board, gameState, myHead);

    if(checkEnclosure(board, headNode, gameState).turns == 0){
        pathfindTo = findClosestOpening(gameState, board, headNode).path;
    }

    if(checkEnclosure(board, headNode, gameState) && !aStar(board, headNode, pathfindTo).path[1]){
        console.log("Enclosed, Closest Opening:");
        console.log(findClosestOpening(gameState, board, headNode));
        let pathToNearest = findClosestOpening(gameState, board, headNode).path[1]


        pathfindTo = pathToNearest;
    }

    let path = aStar(board, headNode, pathfindTo);

    console.log("Path: " + path.path + " Cost: " + path.cost);
    
    
    if(path.cost > 19){
        console.log("Unsafe, checking moves: " + board[headNode].connections.length);
        let lowestCost = {path: [], cost: Infinity};
        for(let i = 0; i < board[headNode].connections.length; i++){
            let newPath = aStar(board, headNode, board[headNode].connections[i][0]);
            console.log(newPath)
            if(newPath.cost < lowestCost.cost){
                //console.log("through balls")
                lowestCost.path = newPath;
                lowestCost.cost = newPath.cost;
            }
        }
        if(path.cost > lowestCost.cost){
            path = lowestCost.path;
        }
    }
    
    if(path.cost == Infinity){
        console.log("No Path, Closest Opening:")
        console.log(findClosestOpening(gameState, board, headNode));
        let path1 = aStar(board, headNode, board[findClosestOpening(gameState, board, headNode).path[1]].connections[0][0]);
        let path2 = aStar(board, headNode, board[findClosestOpening(gameState, board, headNode).path[1]].connections[1][0]);


        path = path1.path[1] ? path1 : path2;
    }
    
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
    let hazards = [];
    let edges = [];
    let food = [];
    const tailNode = getNodeId(gameState.you.body[gameState.you.body.length-1], gameState);

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
    let c = 0;
    for(let i = 0; i < gameState.board.height; i++){
        edges.push(getNodeId({x: 0, y: 0 + c}, gameState));
        edges.push(getNodeId({x: gameState.board.width - 1, y: 0 + c}, gameState));
    }
    for(let i = 0; i < gameState.board.width; i++){
        edges.push(getNodeId({x: 0 + c, y: 0}, gameState));
        edges.push(getNodeId({x: 0 + c, y: gameState.board.height - 1}, gameState));
    }
    if(gameState.board.hazards){
        for(let i = 0; i < gameState.board.hazards.length; i++){
            hazards.push(getNodeId(gameState.board.hazards[i], gameState));
        }
    }
    for(let i = 0; i < gameState.you.body.length; i++){
        const bodyNode = getNodeId(gameState.you.body[i], gameState);
        if(bodyNode != tailNode || (gameState.you.health == 100 && beside(gameState.you.body[0], gameState.you.body[gameState.you.body.length-1]))){
            snakeBodies.push(bodyNode);
        }
    }
    for(let i = 0; i < gameState.board.food.length; i++){
        food.push(getNodeId(gameState.board.food[i], gameState));
    }

    for(let i = 0; i < (gameState.board.width * gameState.board.height); i++){
        for(let j = 0; j < (gameState.board.width * gameState.board.height); j++)
        {
            if(((board[j].position.x == board[i].position.x-1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.x == board[i].position.x+1 && board[j].position.y == board[i].position.y) || 
            (board[j].position.y == board[i].position.y-1 && board[j].position.x == board[i].position.x) || 
            (board[j].position.y == board[i].position.y+1 && board[j].position.x == board[i].position.x)) &&
            (!snakeBodies.includes(j))){
                if (snakeHeads.includes(j) && food.includes(j)){
                    board[i].connections.push([j, 110]);
                } else if(snakeHeads.includes(j)){
                    board[i].connections.push([j, 100]);
                } else if(hazards.includes(j) || edges.includes(j)){
                    board[i].connections.push([j, 20]);
                }else if(food.includes(j)){
                    board[i].connections.push([j, 5]);
                } else {
                    board[i].connections.push([j, 1]);
                }
            };
        }
    }

    for(let i = 0; i < board.length; i++){
        if(board[i].connections.length == 1 || board[i].connections.length == 2){
            board[i].connections[0][1] = 100;
            board[i].connections[1][1] = 100;
        }
    }

    return board;
}
//
// END BUILD GRAPH

// A-STAR APTHFINDING
//
//
function aStar(graph, start, target, from = undefined){
    let openSet = [{ node: start, f: 0, path: [start] }];
    let gScores = { [start]: 0 };

    while (openSet.length > 0) {

        openSet.sort((a, b) => a.f - b.f);
        let current = openSet.shift();
        if(from == 'flood'){
            console.log(current.path);
        }

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

function findLongestPath(board, start, end) {
    let maxPath = [];
    let maxWeight = -Infinity;

    function dfs(current, path, weight, visited) {
        if (current === end) {
            if (weight > maxWeight) {
                maxWeight = weight;
                maxPath = [...path];
            }
            return;
        }

        for (const [neighbor, cost] of board[current].connections || []) {
            if (!visited.has(neighbor) && cost != 100) {
                visited.add(neighbor);
                path.push(neighbor);
                dfs(neighbor, path, weight + cost, visited);
                path.pop();
                visited.delete(neighbor);
            }
        }
    }

    dfs(start, [start], 0, new Set([start]));

    return { path: maxPath, cost: maxWeight };
}

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
        let pathToFood = aStar(board, getNodeId(myHead, gameState), safeFood[i])
        if(pathToFood.cost > 19){
            continue;
        }
        let dist = pathToFood.path.length;
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
        console.log("No Food, Moving to Tail");
        return aStar(board, getNodeId(myHead, gameState), getNodeId(gameState.you.body[gameState.you.body.length-1], gameState)).path[1];
    }
    
}

function huntSnake(gameState, board, headNode){
    let snakeIndicesByLength = [];
    for(let i = 0; i < gameState.board.snakes.length; i++){
        if(gameState.board.snakes[i].id != gameState.you.id){
            snakeIndicesByLength.push(i);
        }
    }

    snakeIndicesByLength.sort((a, b) => gameState.board.snakes[b].body.length-gameState.board.snakes[a].body.length);

    for(let i = 0; i < snakeIndicesByLength.length; i++){
        let connectionsArr = besideArr(gameState.board.snakes[i].body[0], gameState);
        for(let i = 0; i < connectionsArr.length; i++){
            let pathToConnection = aStar(board, headNode, connectionsArr[i]);
            if(pathToConnection.path[1]){
                return pathToConnection.path[1];
            }
        }
    }
}

function checkEnclosure(board, headNode, gameState){
    let up = bfs(board, getNodeId({x:board[headNode].position.x, y:board[headNode].position.y + 1}, gameState) ?? headNode);
    let down = bfs(board, getNodeId({x:board[headNode].position.x, y:board[headNode].position.y - 1}, gameState) ?? headNode);
    let left = bfs(board, getNodeId({x:board[headNode].position.x - 1, y:board[headNode].position.y}, gameState) ?? headNode);
    let right = bfs(board, getNodeId({x:board[headNode].position.x + 1, y:board[headNode].position.y}, gameState) ?? headNode);

    let arr = [up, down, left, right];
    arr = arr.filter((dir) => dir != undefined);
    arr = arr.sort((a, b) => a - b);
    return arr[arr.length-1] < gameState.you.body.length;
}

function besideArr(point, gameState){
    let connectionUp = getNodeId({x: point.x, y: point.y + 1}, gameState);
    let connectionDown = getNodeId({x: point.x, y: point.y - 1}, gameState);
    let connectionLeft = getNodeId({x: point.x - 1, y: point.y}, gameState);
    let connectionRight = getNodeId({x: point.x + 1, y: point.y}, gameState);

    let connectionsArr = [connectionUp, connectionDown, connectionLeft, connectionRight];
    connectionsArr = connectionsArr.filter((node) => node != undefined);
    connectionsArr = connectionsArr.filter((node) => !isOccupied(node, gameState));

    return connectionsArr;
}

function findClosestOpening(gameState, board, headNode) {
    const snakeBody = gameState.you.body;
    const tailIndex = snakeBody.length - 1;

    const pathToTail = aStar(board, headNode, getNodeId(snakeBody[tailIndex], gameState));
    if(pathToTail.path[1]){
        return {path: pathToTail.path, turns: 0};
    }

    for (let turn = 1; turn <= tailIndex; turn++) {
        
        const futureTail = snakeBody[tailIndex - turn]; 
        const futureTailNode = getNodeId(futureTail, gameState);

        let connectionsArr = besideArr(futureTail, gameState);

        if(findLongestPath(board, headNode, connectionsArr[0]).path[1]) {
            //console.log("1st path + " + { path: aStar(board, headNode, connectionsArr[0]).path, turns: turn }.path);
            console.log("Taking path 1");
            return { path: findLongestPath(board, headNode, connectionsArr[0]).path, turns: turn }; 
        } else if(findLongestPath(board, headNode, connectionsArr[1]).path[1]){
            //console.log("2nd path + " + { path: aStar(board, headNode, connectionsArr[0]).path, turns: turn }.path);
            console.log("Taking path 2");
            return { path: findLongestPath(board, headNode, connectionsArr[1]).path, turns: turn }; 
        }
    }


    return null;
}

//
//
// NEAREST/FARTHEST

// TOOLS
//
//

// IS OCCUPIED
function isOccupied(node, gameState) {
    let snakeBodies = gameState.board.snakes.flatMap(snake => snake.body);
    snakeBodies = snakeBodies.map((part) => getNodeId(part, gameState));
    //console.log(snakeBodies);
    return snakeBodies.includes(node);
}

// GET NODE ID
function getNodeId(pos, gameState){
    if(pos.y < gameState.board.height && pos.x < gameState.board.width && pos.y >= 0 && pos.x >= 0){
        return pos.y*gameState.board.width + pos.x;
    } else {
        return undefined;
    }
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

    let findTail = aStar(board, headNode, getNodeId(gameState.you.body[gameState.you.body.length-1], gameState));
    //console.log(findTail);

    if(findTail.path[1] && (!aStar(board, board[headNode].connections[paths[0].connection][0], board[headNode].connections[paths[paths.length-1].connection][0]).path[1] || board[headNode].connections[paths[0].connection][0] == board[headNode].connections[paths[paths.length-1].connection][0])){
        //console.log("finding tail side " + findTail.path);
        return findTail.path[1];
    }
    
    if(beside(gameState.you.body[0], gameState.you.body[gameState.you.body.length-1]) && gameState.you.health < 100 && gameState.you.health > 50 && checkEnclosure(board, headNode, gameState)){
        return getNodeId(gameState.you.body[gameState.you.body.length-1], gameState);
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