const serverSystem = server.registerSystem(0, 0);

const positionArray = new Array(0);
const globalVars = {};

globalVars.fillingBlock = {};
globalVars.fillingBlock.block = 0;
globalVars.fillingBlock.blockState = 0;

globalVars.breakingBlock = {};
globalVars.breakingBlock.block = 0;
globalVars.breakingBlock.blockState = 0;

globalVars.playerHand = {};
globalVars.playerHand.mainHand = 0;
globalVars.playerHand.offHand = 0;

globalVars.tickingArea = 0;
globalVars.time = 0;
globalVars.enabled = true;

serverSystem.initialize = function() {
    /*serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => {
        displayChat(JSON.stringify(eventData, null, "\t"));

        globalVars.tickingArea = serverSystem.getComponent(eventData.data.player, "minecraft:tick_world").data.globalVars.tickingArea;
        globalVars.fillingBlock.block = serverSystem.getBlock(globalVars.tickingArea, eventData.data.block_position);

        displayChat(JSON.stringify(globalVars.fillingBlock.block, null, "\t"));

        globalVars.fillingBlock.blockState = serverSystem.getComponent(globalVars.fillingBlock.block, "minecraft:blockstate").data;

        displayChat(JSON.stringify(globalVars.fillingBlock.blockState, null, "\t"));
    });*/
    this.listenForEvent("minecraft:entity_created", (eventData) => {
        if (globalVars.enabled) {
            //displayChat(JSON.stringify(eventData,null,'\t'))
            const entity = eventData.data.entity;
            if (entity.__identifier__ === "worldedit:select") this.entitySelect(entity);
            else if (entity.__identifier__ === "worldedit:execute") this.entityExecute(entity);
        }
    });

    this.listenForEvent("minecraft:block_destruction_started", (eventData) => {
        if (globalVars.enabled) this.destroyBlockStartHandler(eventData.data);
    });
    this.listenForEvent("minecraft:block_destruction_stopped", (eventData) => {
        if (globalVars.enabled) this.destroyBlockEndHandler(eventData.data);
    });
    this.listenForEvent("minecraft:entity_carried_item_changed", (eventData) => {
        if (globalVars.enabled) this.handItemChangedHandler(eventData.data);
    });
};

serverSystem.update = function() {
    globalVars.time++;
};

serverSystem.displayChat = function displayChat(message = " ") {
    const eventData = this.createEventData("minecraft:display_chat_event");
    if (eventData) {
        eventData.data.message = `[WorldEdit] ${message}`;
        this.broadcastEvent("minecraft:display_chat_event", eventData);
    }
};

serverSystem.addLog = function addLog(message = " ") {
    this.log(`[WorldEdit] ${message}`);
};

// SELECT

serverSystem.entitySelect = function entitySelect(entity) {
    const position = this.getComponent(entity, "minecraft:position").data;

    this.select(position);

    this.destroyEntity(entity);
};

serverSystem.axeSelect = function axeSelect(position) {
    this.select(position);
};

serverSystem.select = function select(position) {
    this.displayChat(`Selecting position [${position.x}, ${position.y}, ${position.z}]`);
    positionArray.push(position);
    if (positionArray.length >= 3) {
        this.displayChat("Warning: Positions exceeded. The first position is ignored.");
        positionArray.shift();
    }
};

// EXECUTE

serverSystem.entityExecute = function entityExecute(entity) {
    this.execute();

    this.destroyEntity(entity);
};

serverSystem.playerExecute = function playerExecute() {
    this.execute();
};

serverSystem.execute = function execute() {
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

    this.displayChat(
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
                this.generateBlock({ x, y, z }, globalVars.fillingBlock.block, globalVars.fillingBlock.blockState);
            }
        }
    }
};

// TOGGLE

serverSystem.toggle = function toggle() {
    if (globalVars.enabled === true) globalVars.enabled = false;
    else globalVars.enabled = true;
};

// GENERATEBLOCK

serverSystem.generateBlock = function generateBlock(
    position = { x: 0, y: 0, z: 0 },
    block = null,
    blockState = null,
    tickingArea = getTickingArea(),
) {
    if (block) {
        position.x = position.x || 0;
        position.y = position.y || 0;
        position.z = position.z || 0;

        this.executeCommand(
            `/setblock ${position.x} ${position.y} ${position.z} ${block.__identifier__.slice("minecraft:".length)}`,
            (commandResultData) => {
                if (blockState) {
                    /*displayChat(JSON.stringify(commandResultData, null, "\t"));
            displayChat("Position now:");
            displayChat(x);
            displayChat(y);
            displayChat(z);*/

                    const targetBlock = this.getBlock(tickingArea, position.x, position.y, position.z);

                    //displayChat(JSON.stringify(targetBlock, null, "\t"));

                    const targetBlockStateComponent = this.getComponent(targetBlock, "minecraft:blockstate");
                    targetBlockStateComponent.data = blockState;
                    this.applyComponentChanges(targetBlock, targetBlockStateComponent);
                } else {
                    this.addLog("generateBlock called with no blockState");
                }
            },
        );
    } else {
        this.addLog("generateBlock called with no block");
    }
};

// BLOCK HANDLERS

serverSystem.destroyBlockStartHandler = function destroyBlockStartHandler(data) {
    // Check if being broken by wooden axe
    if (this.getHand(data.player).mainHand.item === "minecraft:wooden_axe") {
        const blockPostion = data.block_position;
        const block = this.getBlock(getTickingArea(data.player), blockPostion);
        const blockState = this.getComponent(block, "minecraft:blockstate").data;

        this.executeCommand("/gamerule doTileDrops false", (commandResultData) => {});

        globalVars.breakingBlock.block = block;
        globalVars.breakingBlock.blockState = blockState;
    }
};

serverSystem.destroyBlockEndHandler = function destroyBlockEndHandler(data) {
    // Improve performance?
    if (data.destruction_progress >= 1) {
        // Check if being broken by wooden axe
        if (this.getHand(data.player).mainHand.item === "minecraft:wooden_axe") {
            const block = globalVars.breakingBlock.block;
            const blockState = globalVars.breakingBlock.blockState;

            this.generateBlock(block.block_position, block, blockState);

            this.executeCommand("/gamerule doTileDrops true", (commandResultData) => {});

            this.axeSelect(block.block_position);
        }
    }
};

// HAND ITEM CHANGED HANDLERS

serverSystem.handItemChangedHandler = function handItemChangedHandler(data) {
    if (data.entity.__identifier__ === "minecraft:player") {
        const hand = this.getHand(data.entity);
        if (hand.offHand.__identifier__ === "minecraft:totem") this.handTotemHandler(data, hand);
        else if (hand.offHand.__identifier__ === "minecraft:shield") this.handShieldHandler(data, hand);
    }
};

serverSystem.handTotemHandler = function handTotemHandler(data, hand) {};

serverSystem.handShieldHandler = function handShieldHandler(data, hand) {};

// UTILITIES

serverSystem.getHand = function getHand(player) {
    const handObject = this.getComponent(player, "minecraft:hand_container").data;
    const mainHand = handObject[0];
    const offHand = handObject[1];
    globalVars.playerHand.mainHand = mainHand;
    globalVars.playerHand.offHand = offHand;
    return { mainHand, offHand, handObject };
};

serverSystem.getTickingArea = function getTickingArea(player) {
    const tickingArea = this.getComponent(player, "minecraft:tick_world").data.tickingArea;
    globalVars.tickingArea = tickingArea;
    return tickingArea;
};
