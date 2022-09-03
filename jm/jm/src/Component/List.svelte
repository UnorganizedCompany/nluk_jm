<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous">
    import { list } from "../store"
</script>

<div align="left" style="margin-bottom: 50px">
    <img src="logo.png" width=200 draggable="false"/>
</div>
<table class="table table-hover">
    <tbody align="left">
        {#each Object.values($list) as row}
        <tr>
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