<script>

    let drop_zone;
    let objects = [
        { el: null, id: "q" },
        { el: null, id: "w" },
        { el: null, id: "e" },
        { el: null, id: "r" },
        { el: null, id: "t" },
        { el: null, id: "y" },
        { el: null, id: "u" },
        { el: null, id: "i" },
        { el: null, id: "o" },
        { el: null, id: "p" },

        { el: null, id: "a" },
        { el: null, id: "s" },
        { el: null, id: "d" },
        { el: null, id: "f" },
        { el: null, id: "g" },
        { el: null, id: "h" },
        { el: null, id: "j" },
        { el: null, id: "k" },
        { el: null, id: "l" },

        { el: null, id: "z" },
        { el: null, id: "x" },
        { el: null, id: "c" },
        { el: null, id: "v" },
        { el: null, id: "b" },
        { el: null, id: "n" },
        { el: null, id: "m" },

        { el: null, id: "return" }, 
    ];

    let dropped = [];
    let text = "";

    let dropped_in = "";
    let activeEvent = "";
    let originalX = "";
    let originalY = "";
    let originalPos = {
        "q": {"x": "50px", "y":"312px"},
        "w": {"x": "90px", "y":"312px"},
        "e": {"x": "130px", "y":"312px"},
        "r": {"x": "170px", "y":"312px"},
        "t": {"x": "210px", "y":"312px"},
        "y": {"x": "250px", "y":"312px"},
        "u": {"x": "290px", "y":"312px"},
        "i": {"x": "330px", "y":"312px"},
        "o": {"x": "370px", "y":"312px"},
        "p": {"x": "410px", "y":"312px"},

        "a": {"x": "70px", "y":"365px"},
        "s": {"x": "110px", "y":"365px"},
        "d": {"x": "150px", "y":"365px"},
        "f": {"x": "190px", "y":"365px"},
        "g": {"x": "230px", "y":"365px"},
        "h": {"x": "270px", "y":"365px"},
        "j": {"x": "310px", "y":"365px"},
        "k": {"x": "350px", "y":"365px"},
        "l": {"x": "390px", "y":"365px"},

        "z": {"x": "110px", "y":"420px"},
        "x": {"x": "150px", "y":"420px"},
        "c": {"x": "190px", "y":"420px"},
        "v": {"x": "230px", "y":"420px"},
        "b": {"x": "270px", "y":"420px"},
        "n": {"x": "310px", "y":"420px"},
        "m": {"x": "350px", "y":"420px"},
    }

    function handleDragEnter(e) {
    }

    function handleDragLeave(e) {
     }

    function handleDragDrop(e) {
        e.preventDefault();
        var element_id = e.dataTransfer.getData("text");
        dropped = dropped.concat(element_id);
        dropped_in = true;
        status = "You droped " + element_id + " into drop zone";
    }

    function handleDragStart(e) {
        status = "Dragging the element " + e.target.getAttribute("id");
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.setData("text", e.target.getAttribute("id"));
    }

    function handleDragEnd(e) {
        if (dropped_in == false) {
            status = "You let the " + e.target.getAttribute("id") + " go.";
        }
        dropped_in = false;
    }

    function handleTouchStart(e) {
        status = "Touch start with element " + e.target.getAttribute("id");
        console.log(e.target.offsetLeft, e.target.offsetTop);
        originalX = e.target.offsetLeft  + "px";
        originalY = e.target.offsetTop  + "px";
        activeEvent = "start";
    }

    function handleTouchMove(e) {
        let touchLocation = e.targetTouches[0];
        let pageX = Math.floor(touchLocation.pageX -10) + "px";
        let pageY = Math.floor(touchLocation.pageY -10) + "px";
        status = "Touch x " + pageX + " Touch y " + pageY;
        e.target.style.position = "absolute";
        e.target.style.left = pageX;
        e.target.style.top = pageY;
        activeEvent = "move";
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (activeEvent === "move") {
            let pageX = parseInt(e.target.style.left) - 50;
            let pageY = parseInt(e.target.style.top) - 50;

            if (
                detectTouchEnd(
                    drop_zone.offsetLeft,
                    drop_zone.offsetTop,
                    pageX,
                    pageY,
                    drop_zone.offsetWidth,
                    drop_zone.offsetHeight
                )
            ) {
                dropped = dropped.concat(e.target.id);
                text += e.target.id;
                e.target.style.position = "initial";
                dropped_in = true;
                status =
                    "You dropped " +
                    e.target.getAttribute("id") +
                    " into drop zone";
                }    
            
            
            e.target.style.left = originalPos[e.target.id].x;
            e.target.style.top = originalPos[e.target.id].y;
            e.target.style.position = "absolute";
        }
    }

    function detectTouchEnd(x1, y1, x2, y2, w, h) {
        //Very simple detection here
        if (x2 - x1 > 2*w) return false;
        if (y2 - y1 > 2*h) return false;
        return true;
    }

    function onReturnClicked() {
        console.log("return clicked")
        console.log(text)
        var list = JSON.parse(localStorage.pseudo_twitter_list)
        list.push(text)
        localStorage.pseudo_twitter_list = JSON.stringify(list)
        
        window.location.href = "/nluk_jm"
    }

    let keyboardSrc = "keyboard2.png";
</script>
<div align="left" style="margin-bottom: 20px">
    <img src="logo.png" width=200 draggable="false"/>
</div>
<div
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:drop={handleDragDrop}
    bind:this={drop_zone}
    id="drop_zone"
    ondragover="return false"
>
{text}
<!--
    {#each dropped as d }
        <h1>{d}</h1>
    {/each}
    -->
</div>

<img src={keyboardSrc} alt="keyboard" width="400px" draggable="false"/>

<div
    id="q"
    style="position:absolute;top:312px;right:412px"
    class="objects"
    draggable="true"
    bind:this={objects[0].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    q
</div>
<div
    id="w"
    style="position:absolute;top:312px;right:372px"
    class="objects"
    draggable="true"
    bind:this={objects[0].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    w
</div>
<div
    id="e"
    style="position:absolute;top:312px;right:332px"
    class="objects"
    draggable="true"
    bind:this={objects[1].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    e
</div>
<div
    id="r"
    style="position:absolute;top:312px;right:292px"
    class="objects"
    draggable="true"
    bind:this={objects[2].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    r
</div>
<div
    id="t"
    style="position:absolute;top:312px;right:252px"
    class="objects"
    draggable="true"
    bind:this={objects[3].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    t
</div>
<div
    id="y"
    style="position:absolute;top:312px;right:212px"
    class="objects"
    draggable="true"
    bind:this={objects[4].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    y
</div>
<div
    id="u"
    style="position:absolute;top:312px;right:172px"
    class="objects"
    draggable="true"
    bind:this={objects[5].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    u
</div>
<div
    id="i"
    style="position:absolute;top:312px;right:132px"
    class="objects"
    draggable="true"
    bind:this={objects[6].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    i
</div>
<div
    id="o"
    style="position:absolute;top:312px;right:92px"
    class="objects"
    draggable="true"
    bind:this={objects[7].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    o
</div>
<div
    id="p"
    style="position:absolute;top:312px;right:52px"
    class="objects"
    draggable="true"
    bind:this={objects[8].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    p
</div>

<div
    id="a"
    style="position:absolute;top:365px;right:392px"
    class="objects"
    draggable="true"
    bind:this={objects[9].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    a
</div>
<div
    id="s"
    style="position:absolute;top:365px;right:352px"
    class="objects"
    draggable="true"
    bind:this={objects[10].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    s
</div>
<div
    id="d"
    style="position:absolute;top:365px;right:312px"
    class="objects"
    draggable="true"
    bind:this={objects[11].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    d
</div>
<div
    id="f"
    style="position:absolute;top:365px;right:272px"
    class="objects"
    draggable="true"
    bind:this={objects[12].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    f
</div>
<div
    id="g"
    style="position:absolute;top:365px;right:232px"
    class="objects"
    draggable="true"
    bind:this={objects[13].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    g
</div>
<div
    id="h"
    style="position:absolute;top:365px;right:192px"
    class="objects"
    draggable="true"
    bind:this={objects[14].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    h
</div>
<div
    id="j"
    style="position:absolute;top:365px;right:152px"
    class="objects"
    draggable="true"
    bind:this={objects[15].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    j
</div>
<div
    id="k"
    style="position:absolute;top:365px;right:112px"
    class="objects"
    draggable="true"
    bind:this={objects[16].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    k
</div>
<div
    id="l"
    style="position:absolute;top:365px;right:72px"
    class="objects"
    draggable="true"
    bind:this={objects[17].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    l
</div>
<div
    id="z"
    style="position:absolute;top:420px;right:352px"
    class="objects"
    draggable="true"
    bind:this={objects[18].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    z
</div>
<div
    id="x"
    style="position:absolute;top:420px;right:312px"
    class="objects"
    draggable="true"
    bind:this={objects[19].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    x
</div>
<div
    id="c"
    style="position:absolute;top:420px;right:272px"
    class="objects"
    draggable="true"
    bind:this={objects[20].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    c
</div>
<div
    id="v"
    style="position:absolute;top:420px;right:232px"
    class="objects"
    draggable="true"
    bind:this={objects[21].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    v
</div>
<div
    id="b"
    style="position:absolute;top:420px;right:192px"
    class="objects"
    draggable="true"
    bind:this={objects[22].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    b
</div>
<div
    id="n"
    style="position:absolute;top:420px;right:152px"
    class="objects"
    draggable="true"
    bind:this={objects[23].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    n
</div>
<div
    id="m"
    style="position:absolute;top:420px;right:112px"
    class="objects"
    draggable="true"
    bind:this={objects[24].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    m
</div>
<div
    id="return"
    style="position:absolute;top:480px;right:52px"
    class="return"
    draggable="true"
    on:click={onReturnClicked}
    bind:this={objects[25].el}
>
    return
</div>
<!--
{#each objects.filter((v) => !dropped.includes(`${v.id}`)) as { id }, i}
    <div
        {id}
        class="objects"
        draggable="true"
        bind:this={objects[i].el}
        on:dragstart={handleDragStart}
        on:dragend={handleDragEnd}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
    >
        Object {id}
    </div>
{/each}
-->
<style>
    :global(html),
    :global(body) {
        margin: 0;
        width: 492px;
        height: 677px;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
    }

    #drop_zone {
        background-color: #eee;
        border: #999 1px solid;
        width: 400px;
        height: 250px;
        padding: 8px;
        font-size: 19px;
    }

    .objects {
        display: inline-block;
        background-color: #ffffff;
        border: #ffdfbc6a 0px solid;
        width: 30px;
        height: 30px;
        margin: 0px;
        padding: 0px;
        font-size: 25px;
        color: #000000;
        text-align: center;
        cursor: move;
    }

    .return {
        display: inline-block;
        background-color: #AEB4BD;
        border: #ffdfbc6a 0px solid;
        width: 90px;
        height: 30px;
        margin: 0px;
        padding: 0px;
        font-size: 17px;
        color: #000000;
        text-align: center;
        cursor: move;
    }
</style>
