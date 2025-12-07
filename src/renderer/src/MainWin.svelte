<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import './mainwin.css';

  let isCapturing = false;
  let streamingArea: HTMLDivElement;
  let videoCropArea: HTMLDivElement;
  let resizeWindowModal: HTMLDialogElement;
  let video: HTMLVideoElement;
  let isDragging = false;
  const windowSize = { width: 800, height: 600 };
  const cropData = { x: 0, y: 0, width: 0, height: 0 };

  const minimizeWindow = () => {
    window.API.minimizeWindow();
  };

  const toggleMaxWindow = () => {
    window.API.toggleMaxWindow();
  };

  const closeApp = () => {
    window.API.closeApp();
  };

  const disableIsCapturing = () => {
    isCapturing = false;
  };

  const toggleResizeWindowModal = () => {
    if (resizeWindowModal.open) {
      resizeWindowModal.close();
    } else {
      resizeWindowModal.showModal();
    }
  };

  const toggleStream = async (): Promise<void> => {
    if (!isCapturing) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
      });
      if (!stream) {
        isCapturing = false;
        return;
      }
      isCapturing = true;
      stream.addEventListener('inactive', disableIsCapturing);
      video.srcObject = stream.getVideoTracks().length > 0 ? stream : null;
      await video.play();
    } else {
      isCapturing = false;
      const stream = video.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      video.srcObject = null;
    }
  };

  const onVideoDragStart = (evt: MouseEvent) => {
    evt.preventDefault();
    cropData.x = evt.clientX;
    cropData.y = evt.clientY;
    isDragging = true;
  }

  const onVideoDragStop = (evt: MouseEvent) => {
    evt.preventDefault();
    cropData.x = 0;
    cropData.y = 0;
    isDragging = false;
  };

  const onVideoDrag = (evt: MouseEvent) => {
    evt.preventDefault();
    if (!isDragging) return;
    const dx = evt.clientX - cropData.x;
    const dy = evt.clientY - cropData.y;
    cropData.x = evt.clientX;
    cropData.y = evt.clientY;
    const rect = video.getBoundingClientRect();
    let newLeft = rect.left + dx;
    let newTop = rect.top + dy;
    const cropRect = videoCropArea.getBoundingClientRect();
    if (newLeft > cropRect.left) newLeft = cropRect.left;
    if (newTop > cropRect.top) newTop = cropRect.top;
    if (newLeft + rect.width < cropRect.right) newLeft = cropRect.right
      - rect.width;
    if (newTop + rect.height < cropRect.bottom) newTop = cropRect.bottom
      - rect.height;
    video.style.left = newLeft - cropRect.left + 'px';
    video.style.top = newTop - cropRect.top + 'px';
  };

  const updateWindowSize = async () => {
    const winSize = await window.API.getWindowSize();
    windowSize.width = winSize.width;
    windowSize.height = winSize.height;
  };

  const resizeStreamingArea = () => {
    if (!isCapturing) return;
    videoCropArea.style.width = streamingArea.clientWidth + 'px';
    videoCropArea.style.height = streamingArea.clientHeight + 'px';
  };

  const onWindowResize = async () => {
    await updateWindowSize();
    resizeStreamingArea();
  };

  onMount(async () => {
    const winSize = await window.API.getWindowSize();
    windowSize.width = winSize.width;
    windowSize.height = winSize.height;
    window.addEventListener('resize', onWindowResize);
    video.addEventListener('play', resizeStreamingArea);
  });

  onDestroy(() => {
    window.removeEventListener('resize', onWindowResize);
    video.removeEventListener('play', resizeStreamingArea);
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.addEventListener('inactive', disableIsCapturing);
    }
  });

</script>

<dialog bind:this={resizeWindowModal} class="modal win-no-drag">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Resize Window</h3>
    <p class="py-4">Enter the desired width and height for the application window:</p>
    <form
      on:submit|preventDefault={(evt) => {
        const formData = new FormData(evt.target as HTMLFormElement);
        const width = parseInt(formData.get('width') as string, 10);
        const height = parseInt(formData.get('height') as string, 10);
        window.API.resizeWindow(width, height);
        toggleResizeWindowModal();
      }}
      class="grid grid-cols-2 gap-4"
    >
      <div>
        <label for="width" class="block font-medium mb-1">Width:</label>
        <input
          type="number"
          id="width"
          name="width"
          min="100"
          value={windowSize.width}
          required
          class="input input-bordered w-full"
        />
      </div>
      <div>
        <label for="height" class="block font-medium mb-1">Height:</label>
        <input
          type="number"
          id="height"
          name="height"
          min="100"
          value={windowSize.height}
          required
          class="input input-bordered w-full"
        />
      </div>
      <div class="col-span-2 flex justify-end mt-4">
        <button type="submit" class="btn btn-primary">Resize</button>
      </div>
    </form>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>

<div class="h-full flex flex-col">
  <div class="win-drag text-base-content menu menu-horizontal bg-base-200 w-full justify-between">
    <ul class="menu menu-horizontal">
      <li class="win-no-drag">
        <button on:click={toggleStream}>
          <div class="tooltip tooltip-bottom" data-tip="{isCapturing ? 'Stop' : 'Start'}">
            <div class="indicator">
              <span class="indicator-item status status-{isCapturing ? 'error' : 'success'}"></span>
                <span aria-hidden="true" class="fa fa-bullseye">
                </span>
                <span class="hidden">{isCapturing ? 'Stop' : 'Start'} Capture</span>
            </div>
          </div>
        </button>
      </li>
      <li class="win-no-drag">
        <button on:click={toggleResizeWindowModal}>
          <div class="tooltip tooltip-bottom" data-tip="Resize window">
            <span aria-hidden="true" class="fa-solid fa-up-right-and-down-left-from-center">
            </span>
            <span class="hidden">Resize window</span>
          </div>
        </button>
      </li>
    </ul>
    <ul class="menu menu-horizontal">
      <li class="win-no-drag">
        <button on:click={minimizeWindow}>
          <div class="tooltip tooltip-bottom" data-tip="Minimize">
              <span aria-hidden="true" class="fa fa-window-minimize">
              </span>
              <span class="hidden">Minimize</span>
          </div>
        </button>
      </li>
      <li class="win-no-drag">
        <button on:click={toggleMaxWindow}>
          <div class="tooltip tooltip-bottom" data-tip="Maximize/Restore">
              <span aria-hidden="true" class="fa fa-window-maximize">
              </span>
              <span class="hidden">Maximize/Restore</span>
          </div>
        </button>
      </li>
      <li class="win-no-drag">
        <button on:click={closeApp}>
          <div class="tooltip tooltip-bottom" data-tip="Close">
              <span aria-hidden="true" class="fa fa-times">
              </span>
              <span class="hidden">Close</span>
          </div>
        </button>
      </li>
    </ul>
  </div>

  <div bind:this={streamingArea} class="min-h-[calc(100vh-65px)] border-2 {isCapturing ? 'border-red-500' : 'win-drag border-green-500 hero'}">
    <div class="hero-content text-center {isCapturing ? 'hidden' : ''}">
      <div class="max-w-md">
        <div role="alert" class="m-5 alert alert-success">
          <span aria-hidden="true" class="fa fa-check">
            <span class="hidden">Info:</span>
          </span>
          <span>Not active</span>
        </div>
        <div class="carousel w-full">
          <div id="item1" class="carousel-item w-full">
            <div role="alert" class="m-5 alert alert-info">
              <span aria-hidden="true" class="fa fa-tv">
                <span class="hidden">Info:</span>
              </span>
              <span>Click the <span class="fa fa-bullseye"><span class="hidden">start capturing</span></span> icon in the menu bar to start capturing your screen.</span>
            </div>
          </div>
          <div id="item2" class="carousel-item w-full">
            <div role="alert" class="m-5 alert alert-info">
              <span aria-hidden="true" class="fa fa-scissors">
                <span class="hidden">Info:</span>
              </span>
              <span>Then, drag the <strong>this area</strong>, which will mirror your screen, to select the desired crop region.</span>
            </div>
          </div>
          <div id="item3" class="carousel-item w-full">
            <div role="alert" class="m-5 alert alert-info">
              <span aria-hidden="true" class="fa fa-tower-broadcast">
                <span class="hidden">Info:</span>
              </span>
              <span>When sharing in a meeting, select <strong>this window</strong>.</span>
            </div>
          </div>
        </div>
        <div class="flex w-full justify-center gap-2 py-2">
          <a href="#item1" class="win-no-drag btn btn-xs">1</a>
          <a href="#item2" class="win-no-drag btn btn-xs">2</a>
          <a href="#item3" class="win-no-drag btn btn-xs">3</a>
        </div>
      </div>
    </div>
    <div bind:this={videoCropArea} class="overflow-hidden relative {isCapturing ? '' : 'hidden'}">
      <video on:mousedown={onVideoDragStart} on:mousemove={onVideoDrag} on:mouseup={onVideoDragStop} bind:this={video} muted class="absolute"></video>
    </div>
  </div>
</div>
<style>
  video {
    max-width: unset;
  }
</style>
