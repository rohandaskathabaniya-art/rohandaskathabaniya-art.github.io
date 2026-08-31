const EMAIL="contact@rohandaskathabaniya.com.np";
const $=s=>document.querySelector(s);
$("#hamb").onclick=()=>$("#nav").classList.toggle("open");
document.querySelectorAll("#nav a").forEach(a=>a.onclick=()=>$("#nav").classList.remove("open"));

function selectService(name){$("#service").value=name;location.hash="contact";setTimeout(()=>$("#service").focus(),300)}
function percentage(){let a=parseFloat($("#pa").value),b=parseFloat($("#pb").value);$("#po").textContent=Number.isFinite(a)&&Number.isFinite(b)?`${(a*b/100).toLocaleString()} result`:"Enter both numbers";}
function gpa(){let total=0,credits=0;for(let i=1;i<=3;i++){let g=parseFloat($("#g"+i).value),c=parseFloat($("#c"+i).value);if(Number.isFinite(g)&&Number.isFinite(c)&&c>0){total+=g*c;credits+=c}}$("#go").textContent=credits?`GPA: ${(total/credits).toFixed(2)}`:"Enter grade and credit";}
$("#wc").oninput=e=>{let t=e.target.value.trim();$("#wo").textContent=`${t?t.split(/\s+/).length:0} words · ${e.target.value.length} characters`};
function qrgen(){let t=$("#qr").value.trim();if(!t){$("#qrout").textContent="Enter text first.";return}$("#qrout").innerHTML=`<img alt="QR code" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(t)}">`}

$("#form").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);let sub=encodeURIComponent("Rohan Digital project — "+f.get("service"));let body=encodeURIComponent(`Hello Rohan Digital,

Name: ${f.get("name")}
Service: ${f.get("service")}
Budget: ${f.get("budget")||"Not specified"}

Details:
${f.get("details")}

Sent from rohandaskathabaniya.com.np`);location.href=`mailto:${EMAIL}?subject=${sub}&body=${body}`};

// Platform polish: smooth reveal for cards.
const revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("platform-visible")}),{threshold:.08});
document.querySelectorAll(".service,.tool,.resource-grid article,.project,.goal-grid button,.trust-grid article,.journey-card,.faq-list details").forEach(e=>revealObserver.observe(e));
