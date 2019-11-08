const serverSystem = server.registerSystem(0, 0);

const positionArray = new Array(0);
let block,
    blockState,
    tickingArea,
    time = 0;

serverSystem.initialize = function() {
    /*serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => {
        displayChat(JSON.stringify(eventData, null, "\t"));

        tickingArea = serverSystem.getComponent(eventData.data.player, "minecraft:tick_world").data.tickingArea;
        block = serverSystem.getBlock(tickingArea, eventData.data.block_position);

        displayChat(JSON.stringify(block, null, "\t"));

        blockState = serverSystem.getComponent(block, "minecraft:blockstate").data;

        displayChat(JSON.stringify(blockState, null, "\t"));
    });*/
    serverSystem.listenForEvent("minecraft:entity_created", (eventData) => {
        //displayChat(JSON.stringify(eventData,null,'\t'))
        const entity = eventData.data.entity;
        if (entity.__identifier__ === "worldedit:select") entitySelect(entity);
        else if (entity.__identifier__ === "worldedit:execute") entityExecute(entity);
    });
    /*serverSystem.listenForEvent("minecraft:entity_carried_item_changed", (eventData) =>
        distroyBlockHandler(eventData.data),
    );*/
};

serverSystem.update = function() {
    time++;
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
    //displayChat(`/fill ${positionArray[0].x} ${positionArray[0].y} ${positionArray[0].z} ${positionArray[1].x} ${positionArray[1].y} ${positionArray[1].z} ${block.__identifier__.slice("minecraft:".length)}`);
    //serverSystem.executeCommand(`/fill ${positionArray[0].x} ${positionArray[0].y} ${positionArray[0].z} ${positionArray[1].x} ${positionArray[1].y} ${positionArray[1].z} ${block.__identifier__.slice("minecraft:".length)}`, (commandResultData) => { ; });
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
            (maxPosition.z - minPosition.z)} blocks), with a block  type of ${block.__identifier__.slice(
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
                generate(x, y, z);
            }
        }
    }
}

function generate(x, y, z) {
    serverSystem.executeCommand(
        `/setblock ${x} ${y} ${z} ${block.__identifier__.slice("minecraft:".length)}`,
        (commandResultData) => {
            /*displayChat(JSON.stringify(commandResultData, null, "\t"));
            displayChat("Position now:");
            displayChat(x);
            displayChat(y);
            displayChat(z);*/

            const targetBlock = serverSystem.getBlock(tickingArea, x, y, z);

            //displayChat(JSON.stringify(targetBlock, null, "\t"));

            const targetBlockStateComponent = serverSystem.getComponent(targetBlock, "minecraft:blockstate");
            targetBlockStateComponent.data = blockState;
            serverSystem.applyComponentChanges(targetBlock, targetBlockStateComponent);
        },
    );
}

// DISTROY BLOCK HANDLER

function distroyBlockHandler(eventData) {}
