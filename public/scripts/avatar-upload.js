import { showMsg } from "./sender-utils.js";

export function initUploadHandler() {

    const btn = document.querySelector(".upload-btn");
    if (btn) {
        btn.addEventListener("click", async () => {
        
            const input = document.querySelector('input[type="file"]');
            let formData = new FormData();
            formData.append("avatar", input.files[0]);
            let res = await fetch("/avatar-upload", {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });
        
            let data = await res.json();
            showMsg(data);
        
        });
    }

}

initUploadHandler();