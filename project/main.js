let map;
let layerKelurahan;
let layerTPS;
let layerRTRW;
let layerSkorKecamatan;

const kecamatanSurvey = ["BINAWIDYA","BUKIT RAYA","TENAYAN RAYA","LIMA PULUH"];
function randomColor(){ return `hsl(${Math.random()*360},70%,65%)`; }

/* BUTTON LANDING */
document.getElementById("btnMap").addEventListener("click", ()=>{
  document.getElementById("landing").style.display="none";
  document.getElementById("map-container").style.display="flex";
  initMap();
});

/* BUTTON BACK */
document.getElementById("btnBack").addEventListener("click", ()=>{
  document.getElementById("map-container").style.display="none";
  document.getElementById("landing").style.display="flex";
});

/* INIT MAP */
function initMap(){
  if(map) return;
  map=L.map("map").setView([0.5071,101.4478],12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap"}).addTo(map);
  loadKelurahan();
  loadRTRW();
}

/* POLYGON KELURAHAN */
function loadKelurahan(){
  fetch("data/Kelurahan_Pekanbaru.geojson").then(res=>res.json()).then(geojson=>{
    layerKelurahan=L.geoJSON(geojson,{
      style:feature=>{
        const warna=randomColor();
        feature.properties._warna=warna;
        return {color:"#2c3e50", weight:2, fillColor:warna, fillOpacity:0.8};
      },
      onEachFeature:(feature,layer)=>{
        const p=feature.properties;
        layer.bindPopup(`<b>Kecamatan:</b> ${p.Kecamatan}<br><b>Kelurahan:</b> ${p.Kelurahan}`);
      }
    }).addTo(map);
    map.fitBounds(layerKelurahan.getBounds());
  });
}

/* FILTER SURVEY */
document.getElementById("chkSurvey").addEventListener("change",function(){
  if(!layerKelurahan) return;
  layerKelurahan.eachLayer(layer=>{
    const kec=(layer.feature.properties.Kecamatan||"").toUpperCase();
    if(this.checked){
      if(kecamatanSurvey.includes(kec)){
        layer.setStyle({fillOpacity:0.95,weight:3});
      }else{
        layer.setStyle({fillOpacity:0.15,weight:1});
      }
    }else{
      layer.setStyle({fillOpacity:0.8,weight:2});
    }
  });
});

/* LOAD RT/RW */
function loadRTRW(){
  const URL="https://rwnxdxpjqvnvmtatkqde.supabase.co";
  const KEY="sb_publishable_OuslRqm2kzVsS6vtpJJONQ_GmCtEhrc";
  layerRTRW=L.layerGroup();
  fetch(`${URL}/rest/v1/rt_rw_web?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}}).then(res=>res.json()).then(data=>{
    data.forEach(d=>{
      const lat=parseFloat(d.lat), lng=parseFloat(d.lng);
      if(isNaN(lat)||isNaN(lng)) return;
      const marker=L.circleMarker([lat,lng],{radius:6,color:"#ffffff",weight:1,fillColor:"#e74c3c",fillOpacity:0.9})
      .bindPopup(`<b>RT ${d.rt} / RW ${d.rw}</b><br>Kecamatan: ${d.kecamatan}<br>Kelurahan: ${d.kelurahan}`);
      layerRTRW.addLayer(marker);
    });
    layerRTRW.addTo(map);
  });
}
document.getElementById("chkRTRW").addEventListener("change",function(){
  if(!layerRTRW) return;
  if(this.checked){ map.addLayer(layerRTRW); }else{ map.removeLayer(layerRTRW); }
});

/* ICON & LOAD TPS */
const iconTPS=L.icon({iconUrl:"https://cdn-icons-png.flaticon.com/512/684/684908.png",iconSize:[28,28]});
function loadTPS(){
  const URL="https://cwwkaghwdxvcmrpinixh.supabase.co";
  const KEY="sb_publishable_EbubdNm2M3uz0b5bkivsPQ_mo9mFtoh";
  layerTPS=L.layerGroup();
  fetch(`${URL}/rest/v1/tabel_tps?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}}).then(res=>res.json()).then(data=>{
    data.forEach(tps=>{
      const lat=parseFloat(tps.latitude), lng=parseFloat(tps.longitude);
      if(isNaN(lat)||isNaN(lng)) return;
      L.marker([lat,lng],{icon:iconTPS}).bindPopup(`<b>Lokasi TPS</b><br>Kecamatan: ${tps.kecamatan}<br>Kelurahan: ${tps.kelurahan}`).addTo(layerTPS);
    });
  });
}
document.getElementById("chkTPS").addEventListener("change",function(){
  if(this.checked){ if(!layerTPS) loadTPS(); layerTPS.addTo(map); } else{ if(layerTPS) map.removeLayer(layerTPS); }
});

/* SKOR KECAMATAN */
function loadSkorKecamatan(){
  const URL="https://cwwkaghwdxvcmrpinixh.supabase.co";
  const KEY="sb_publishable_EbubdNm2M3uz0b5bkivsPQ_mo9mFtoh";
  layerSkorKecamatan=L.layerGroup();
  fetch(`${URL}/rest/v1/kebersihan_kecamatan?select=*`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}}).then(res=>res.json()).then(data=>{
    if(!layerKelurahan) return;
    const namaMapping={"LIMA PULUH":"Lima Puluh","BINAWIDYA":"Binawidya","BUKIT RAYA":"Bukit Raya","TENAYAN RAYA":"Tenayan Raya"};
    const skorMap={};
    data.forEach(d=>{skorMap[d.kecamatan.toUpperCase()]=parseFloat(d.skor_rata_rata);});
    layerKelurahan.eachLayer(layer=>{
      const kecGeo=(layer.feature.properties.Kecamatan||"").toUpperCase();
      const kecSupabase=namaMapping[kecGeo]?namaMapping[kecGeo].toUpperCase():kecGeo;
      if(skorMap[kecSupabase]!==undefined){
        const skor=skorMap[kecSupabase];
        layer.on("click",()=>{layer.bindPopup(`<b>Kecamatan:</b> ${layer.feature.properties.Kecamatan}<br><b>Skor Kebersihan:</b> ${skor}`).openPopup();});
      }
    });
    layerSkorKecamatan.addTo(map);
  });
}
document.getElementById("chkSkor").addEventListener("change",function(){
  if(this.checked){ if(!layerSkorKecamatan) loadSkorKecamatan(); } else{
    if(layerKelurahan) layerKelurahan.eachLayer(layer=>{layer.off("click");});
    map.closePopup();
  }
});
