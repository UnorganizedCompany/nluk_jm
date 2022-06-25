<script>
    let drop_zone;
    let objects = [
        { el: null, id: "ㅂ" },
        { el: null, id: "ㅈ" },
        { el: null, id: "ㄷ" },
        { el: null, id: "ㄱ" },
        { el: null, id: "ㅅ" },
        { el: null, id: "ㅛ" },
        { el: null, id: "ㅕ" },
        { el: null, id: "ㅑ" },
        { el: null, id: "ㅐ" },
        { el: null, id: "ㅔ" },

        { el: null, id: "ㅁ" },
        { el: null, id: "ㄴ" },
        { el: null, id: "ㅇ" },
        { el: null, id: "ㄹ" },
        { el: null, id: "ㅎ" },
        { el: null, id: "ㅗ" },
        { el: null, id: "ㅓ" },
        { el: null, id: "ㅏ" },
        { el: null, id: "ㅣ" },

        { el: null, id: "ㅋ" },
        { el: null, id: "ㅌ" },
        { el: null, id: "ㅊ" },
        { el: null, id: "ㅍ" },
        { el: null, id: "ㅠ" },
        { el: null, id: "ㅜ" },
        { el: null, id: "ㅡ" },
    ];

    let dropped = [];
    let text = "";

    let dropped_in = "";
    let activeEvent = "";
    let originalX = "";
    let originalY = "";

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
        originalX = e.target.offsetLeft - 10 + "px";
        originalY = e.target.offsetTop - 10 + "px";
        activeEvent = "start";
    }

    function handleTouchMove(e) {
        let touchLocation = e.targetTouches[0];
        let pageX = Math.floor(touchLocation.pageX - 50) + "px";
        let pageY = Math.floor(touchLocation.pageY - 50) + "px";
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
            } else {
                e.target.style.left = originalX;
                e.target.style.top = originalY;
                status = "You let the " + e.target.getAttribute("id") + " go.";
            }
        }
    }

    function detectTouchEnd(x1, y1, x2, y2, w, h) {
        //Very simple detection here
        if (x2 - x1 > w) return false;
        if (y2 - y1 > h) return false;
        return true;
    }

    let keyboardSrc = "keyboard.jpg";
</script>

<h1>새 글</h1>
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

<img src={keyboardSrc} alt="keyboard" width="400px" />

<div
    id="ㅂ"
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
    ㅂ
</div>
<div
    id="ㅈ"
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
    ㅈ
</div>
<div
    id="ㄷ"
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
    ㄷ
</div>
<div
    id="ㄱ"
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
    ㄱ
</div>
<div
    id="ㅅ"
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
    ㅅ
</div>
<div
    id="ㅛ"
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
    ㅛ
</div>
<div
    id="ㅕ"
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
    ㅕ
</div>
<div
    id="ㅑ"
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
    ㅑ
</div>
<div
    id="ㅐ"
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
    ㅐ
</div>
<div
    id="ㅔ"
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
    ㅔ
</div>

<div
    id="ㅁ"
    style="position:absolute;top:370px;right:392px"
    class="objects"
    draggable="true"
    bind:this={objects[9].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅁ
</div>
<div
    id="ㄴ"
    style="position:absolute;top:370px;right:352px"
    class="objects"
    draggable="true"
    bind:this={objects[10].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㄴ
</div>
<div
    id="ㅇ"
    style="position:absolute;top:370px;right:312px"
    class="objects"
    draggable="true"
    bind:this={objects[11].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅇ
</div>
<div
    id="ㄹ"
    style="position:absolute;top:370px;right:272px"
    class="objects"
    draggable="true"
    bind:this={objects[12].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㄹ
</div>
<div
    id="ㅎ"
    style="position:absolute;top:370px;right:232px"
    class="objects"
    draggable="true"
    bind:this={objects[13].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅎ
</div>
<div
    id="ㅗ"
    style="position:absolute;top:370px;right:192px"
    class="objects"
    draggable="true"
    bind:this={objects[14].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅗ
</div>
<div
    id="ㅓ"
    style="position:absolute;top:370px;right:152px"
    class="objects"
    draggable="true"
    bind:this={objects[15].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅓ
</div>
<div
    id="ㅏ"
    style="position:absolute;top:370px;right:112px"
    class="objects"
    draggable="true"
    bind:this={objects[16].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅏ
</div>
<div
    id="ㅣ"
    style="position:absolute;top:370px;right:72px"
    class="objects"
    draggable="true"
    bind:this={objects[17].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅣ
</div>
<div
    id="ㅋ"
    style="position:absolute;top:428px;right:352px"
    class="objects"
    draggable="true"
    bind:this={objects[18].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅋ
</div>
<div
    id="ㅌ"
    style="position:absolute;top:428px;right:312px"
    class="objects"
    draggable="true"
    bind:this={objects[19].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅌ
</div>
<div
    id="ㅊ"
    style="position:absolute;top:428px;right:272px"
    class="objects"
    draggable="true"
    bind:this={objects[20].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅊ
</div>
<div
    id="ㅍ"
    style="position:absolute;top:428px;right:232px"
    class="objects"
    draggable="true"
    bind:this={objects[21].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅍ
</div>
<div
    id="ㅠ"
    style="position:absolute;top:428px;right:192px"
    class="objects"
    draggable="true"
    bind:this={objects[22].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅠ
</div>
<div
    id="ㅜ"
    style="position:absolute;top:428px;right:152px"
    class="objects"
    draggable="true"
    bind:this={objects[23].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅜ
</div>
<div
    id="ㅡ"
    style="position:absolute;top:428px;right:112px"
    class="objects"
    draggable="true"
    bind:this={objects[24].el}
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    ㅡ
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
        height: 198px;
        padding: 8px;
        font-size: 19px;
    }

    .objects {
        display: inline-block;
        background-color: #ffffff;
        border: #ffdfbc6a 0px solid;
        width: 30px;
        height: 35px;
        margin: 0px;
        padding: 0px;
        font-size: 25px;
        color: #ff0000;
        text-align: center;
        cursor: move;
    }
</style>
