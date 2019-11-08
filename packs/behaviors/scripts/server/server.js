const serverSystem = server.registerSystem(0, 0);

const positionArray = new Array(0);
const globalVars = {};

globalVars.fillingBlock = {};
globalVars.fillingBlock.block = 0;
globalVars.fillingBlock.blockState = 0;

globalVars.tickingArea = 0;
globalVars.time = 0;

globalVars.breakingBlock = {};
globalVars.breakingBlock.block = 0;
globalVars.breakingBlock.blockState = 0;

serverSystem.initialize = function() {
    /*serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => {
        displayChat(JSON.stringify(eventData, null, "\t"));

        globalVars.tickingArea = serverSystem.getComponent(eventData.data.player, "minecraft:tick_world").data.globalVars.tickingArea;
        globalVars.fillingBlock.block = serverSystem.getBlock(globalVars.tickingArea, eventData.data.block_position);

        displayChat(JSON.stringify(globalVars.fillingBlock.block, null, "\t"));

        globalVars.fillingBlock.blockState = serverSystem.getComponent(globalVars.fillingBlock.block, "minecraft:blockstate").data;

        displayChat(JSON.stringify(globalVars.fillingBlock.blockState, null, "\t"));
    });*/
    serverSystem.listenForEvent("minecraft:entity_created", (eventData) => {
        //displayChat(JSON.stringify(eventData,null,'\t'))
        const entity = eventData.data.entity;
        if (entity.__identifier__ === "worldedit:select") entitySelect(entity);
        else if (entity.__identifier__ === "worldedit:execute") entityExecute(entity);
    });

    serverSystem.listenForEvent("minecraft:block_destruction_started", (eventData) =>
        destroyBlockStartHandler(eventData.data),
    );
    serverSystem.listenForEvent("minecraft:block_destruction_stopped", (eventData) =>
        destroyBlockEndHandler(eventData.data),
    );
};

serverSystem.update = function() {
    globalVars.time++;
};

function displayChat(message) {
    const eventData = serverSystem.createEventData("minecraft:display_chat_event");
    if (eventData) {
        eventData.data.message = `[WorldEdit] ${message}`;
        serverSystem.broadcastEvent("minecraft:display_chat_event", eventData);
    }
}

// SELECT

function entitySelect(entity) {
    const position = serverSystem.getComponent(entity, "minecraft:position").data;

    select(position);

    serverSystem.destroyEntity(entity);
}

function axeSelect(position) {
    select(position);
}

function select(position) {
    displayChat(`Selecting position [${position.x}, ${position.y}, ${position.z}]`);
    positionArray.push(position);
    if (positionArray.length >= 3) {
        displayChat("Warning: Positions exceeded.The first position is ignored.");
        positionArray.shift();
    }
}

// EXECUTE

function entityExecute(entity) {
    execute();

    serverSystem.destroyEntity(entity);
}

function playerExecute() {
    execute();
}

function execute() {
    //displayChat(`/fill ${positionArray[0].x} ${positionArray[0].y} ${positionArray[0].z} ${positionArray[1].x} ${positionArray[1].y} ${positionArray[1].z} ${globalVars.fillingBlock.block.__identifier__.slice("minecraft:".length)}`);
    //serverSystem.executeCommand(`/fill ${positionArray[0].x} ${positionArray[0].y} ${positionArray[0].z} ${positionArray[1].x} ${positionArray[1].y} ${positionArray[1].z} ${globalVars.fillingBlock.block.__identifier__.slice("minecraft:".length)}`, (commandResultData) => { ; });
    const minPosition = {
        x: Math.min(positionArray[0].x, positionArray[1].x),
        y: Math.min(positionArray[0].y, positionArray[1].y),
        z: Math.min(positionArray[0].z, positionArray[1].z),
    };
    const maxPosition = {
        x: Math.max(positionArray[0].x, positionArray[1].x),
        y: Math.max(positionArray[0].y, positionArray[1].y),
        z: Math.max(positionArray[0].z, positionArray[1].z),
    };

    displayChat(
        `Filling [${minPosition.x}, ${minPosition.y}, ${minPosition.z}] to [${maxPosition.x}, ${maxPosition.y}, ${
            maxPosition.z
        }] (${(maxPosition.x - minPosition.x) *
            (maxPosition.y - minPosition.y) *
            (maxPosition.z -
                minPosition.z)} blocks), with a block  type of ${globalVars.fillingBlock.block.__identifier__.slice(
            "minecraft:".length,
        )}.`,
    );

    /*displayChat(minPosition.x);
    displayChat(minPosition.y);
    displayChat(minPosition.z);
    displayChat(maxPosition.x);
    displayChat(maxPosition.y);
    displayChat(maxPosition.z);*/

    for (let x = minPosition.x; x <= maxPosition.x; x++) {
        for (let y = minPosition.y; y <= maxPosition.y; y++) {
            for (let z = minPosition.z; z <= maxPosition.z; z++) {
                /*displayChat("Position:");
                displayChat(x);
                displayChat(y);
                displayChat(z);*/
                generate(x, y, z)
            }
        }
    }
}

function generate(x, y, z) {
    serverSystem.executeCommand(
        `/setblock ${x} ${y} ${z} ${globalVars.fillingBlock.block.__identifier__.slice("minecraft:".length)}`,
        (commandResultData) => {
            /*displayChat(JSON.stringify(commandResultData, null, "\t"));
            displayChat("Position now:");
            displayChat(x);
            displayChat(y);
            displayChat(z);*/

            const targetBlock = serverSystem.getBlock(globalVars.tickingArea, x, y, z);

            //displayChat(JSON.stringify(targetBlock, null, "\t"));

            const targetBlockStateComponent = serverSystem.getComponent(targetBlock, "minecraft:blockstate");
            targetBlockStateComponent.data = globalVars.fillingBlock.blockState;
            serverSystem.applyComponentChanges(targetBlock, targetBlockStateComponent);
        },
    );
}

// BLOCK HANDLERS

function destroyBlockStartHandler(data) {
    const playerHand = serverSystem.getComponent(data.player, "minecraft:hand_container").data[0];

    const blockPostion = data.block_position;
    const block = serverSystem.getBlock(getTickingArea(data.player), blockPostion);
    const blockState = serverSystem.getComponent(block, "minecraft:blockstate").data;

    // Check if being broken by wooden axe
    if (playerHand.item === "minecraft:wooden_axe") {
        return;
    }
}

function destroyBlockEndHandler(data) {}

// UTILITIES

function getTickingArea(player) {
    const tickingArea = serverSystem.getComponent(player, "minecraft:tick_world").data.tickingArea;
    globalVars.tickingArea = tickingArea;
    return tickingArea;
}
