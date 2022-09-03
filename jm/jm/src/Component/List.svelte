<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous">
    import { list } from "../store"
    console.log("hello")
    console.log($list[1])
</script>

<a class="btn btn-primary" href="#/newdoc">새 글</a>
<p>{$list}</p>
<table class="table table-hover">
    <thead>
        <tr>
            <th scope="col" class="text-center">#</th>
            <th scope="col" class="text-center">제목</th>
            <th scope="col" class="text-center">작성일</th>
            <th scope="col" class="text-center">조회수</th>
        </tr>
    </thead>
    <tbody>
        {#each Object.values($list) as row, i}
        <tr>
            <td>{i+1}</td>
            <td>{row}</td>
            
        </tr>
      {/each}
    </tbody>
</table>