<script>
  import Input from "./Input.svelte";
  import Output from "./Output.svelte";
  import { throttle } from "lodash-es";

  let inputVal =
    "我真的不知道到底是我們跟不上時代，還是年輕人現在都是這樣講話？";
  let outputVal;
  let markType = "！";
  let markNum = "1";
  let toReplace = "";

  const END_TAKE = 5;

  let throttle_call_jieba_cut = () => {};

  const handle_call_jieba_cut = () => {
    throttle_call_jieba_cut = throttle(window.call_jieba_cut, 100);
  };

  $: mark = markType.repeat(markNum);

  $: {
    const front = inputVal.substring(0, inputVal.length - END_TAKE);
    const end = inputVal.substring(inputVal.length - END_TAKE);

    throttle_call_jieba_cut(end, function (result) {
      if (!Array.isArray(result)) return;

      let lastWord;
      let i = 0;
      do {
        lastWord = result[result.length - ++i];
      } while (/[,.\?"'~？，。]/.test(lastWord));
      if (lastWord) {
        lastWord = lastWord
          .split("")
          .reduce((acc, curr) => acc + curr + mark, "");
      } else {
        lastWord = "";
      }

      let last = result.slice(result.length - i + 1);
      toReplace =
        front + result.slice(0, -i).join("") + lastWord + last.join("");
    });
  }

  $: outputVal = toReplace.replace(/[,.\?"'~？，。]/g, mark);
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, shrink-to-fit=no"
  />

  <title>語氣加強器</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/turretcss/dist/turretcss.min.css"
    crossorigin="anonymous"
  />
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.0/cash.min.js"></script>
  <script src="https://pulipulichen.github.io/jieba-js/jquery.js"></script>
  <script
    src="https://pulipulichen.github.io/jieba-js/require-jieba-js.js"
    on:load={handle_call_jieba_cut}></script>
  <script src="https://unpkg.com/clipboard@2/dist/clipboard.min.js"></script>
  <script
    src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"
    integrity="sha256-qXBd/EfAdjOA2FGrGAG+b3YBn2tn5A6bhz+LSgYD96k="
    crossorigin="anonymous"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main class="margin-m flex justify-content-center">
  <div class="max-width-xl">
    <h1>語氣加強器</h1>
    <hr />
    <label for="markType" class="lead"
      >驚嘆號種類
      <label class="select padding-top-xs">
        <select class="select" id="markType" bind:value={markType}>
          <option value="！" selected> ！（全形） </option>
          <option value="!"> !(半形) </option>
        </select>
      </label>
    </label>
    <label for="markNum" class="lead"
      >驚嘆號數量（1~10）
      <input
        id="markNum"
        type="range"
        min="1"
        max="10"
        step="1"
        bind:value={markNum}
        {mark}
      />
    </label>
    <hr />
    <Input bind:value={inputVal} />
    <Output value={outputVal} />
  </div>
</main>
<footer class="background-light text-align-center">
  <nav class="font-size-s padding-vertical-m">
    v1.0 ·
    <a
      href="https://github.com/FOBshippingpoint/svelte-exclamationer"
      target="_blank"
      rel="noopener noreferrer">GitHub</a
    >
    ·
    <a
      href="https://www.youtube.com/channel/UC-UzF0F_qnMhwy9oB-DyWsg"
      target="_blank"
      rel="noopener noreferrer">YouTube</a
    >
  </nav>
</footer>

<style>
  :global(body) {
    padding: 0;
  }

  main {
    font-family: "Noto Sans TC", sans-serif;
  }
</style>
