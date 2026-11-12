document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
 const field=document.getElementById(button.dataset.copy);
 try{await navigator.clipboard.writeText(field.textContent);button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1500)}
 catch{const range=document.createRange();range.selectNodeContents(field);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);button.textContent='Selected — press Ctrl+C';}
}));
document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
