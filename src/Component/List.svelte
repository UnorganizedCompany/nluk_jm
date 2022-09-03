<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous">
    if (!localStorage.pseudo_twitter_list) {
        localStorage.pseudo_twitter_list = JSON.stringify(["welcome to pseudo_twitter", "taptaptaptaptaptaptaptaptaptap"])
    }
    var list = JSON.parse(localStorage.pseudo_twitter_list)
    if (!list || list.length == 0) {
        list = JSON.parse(localStorage.pseudo_twitter_list)
    }

    var selectedIdx = -1;
    var clicked = [];
    function onClick() {
        clicked.push([selectedIdx, Date.now()])
        console.log({clicked})

        var len = clicked.length
        if (len < 10) {
            return;
        }

        var achieved = true
        var lastSelected = -1
        var firstClicked = -1
        var lastClicked = -1
        for (var i = len-10; i < len ; i++) {
            if (i == len-10) {
                lastSelected = clicked[i][0]
                firstClicked = clicked[i][1]
                continue
            }
            if (lastSelected != clicked[i][0]){
                achieved = false;
                break;
            }
            if (i == len-1) {
                lastClicked = clicked[i][1]
            }
        }
        console.log(lastClicked - firstClicked)
        achieved = achieved && (lastClicked - firstClicked < 2000)

        if (achieved) {
            alert("abra-cadabra");
            list.splice(lastSelected, 1)
            localStorage.pseudo_twitter_list = JSON.stringify(list)
            location.reload();
        }
    }
</script>

<div align="left" style="margin-bottom: 50px">
    <img src="logo.png" width=200 draggable="false"/>
</div>
<table class="table table-hover">
    <tbody align="left">
        {#each Object.values(list) as row, idx}
        <tr on:click={() => {
            selectedIdx = idx;
            onClick()
            }}>
            <td>{row}</td>
        </tr>
      {/each}
    </tbody>
</table>
<div align="right" >
    <a href="#/newdoc">
        <img width=50 src="new.png" href="#/newdoc">
    </a>
</div>