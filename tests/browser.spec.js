import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const waitSave=async p=>{await expect(p.locator('#save-status')).toContainText('Lokal gespeichert');await p.waitForTimeout(450);};
async function demo(p){await p.goto('./');await p.getByRole('button',{name:'Demo ausprobieren',exact:true}).click();await expect(p.locator('#step-action')).toBeVisible();await waitSave(p);}
async function next(p){await p.locator('#step-action').click();await waitSave(p);}
async function modalSave(p){await p.locator('dialog button[type=submit]').click();await expect(p.locator('dialog')).not.toBeVisible();await waitSave(p);}
async function addWater(p,value){await p.getByRole('button',{name:'Nachguss erfassen',exact:false}).click();await p.locator('#value').fill(value);await modalSave(p);}
async function noOverflow(p){expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
test('Vollständiger Demo-Sud, Persistenz, Wasser, Korrektur, Freigaben und Backup',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await noOverflow(page);await page.screenshot({path:`test-results/${info.project.name}-home.png`,fullPage:true});await demo(page);
 await page.locator('#fast').check();await waitSave(page);await next(page); // preparation
 await page.locator('#step-action').click();await page.locator('#value').fill('16,5');await modalSave(page);
 await addWater(page,'4,0');await addWater(page,'2.5');await addWater(page,'3,5');
 await expect(page.locator('.water-card')).toContainText('26,5 l');await expect(page.locator('.water-card')).toContainText('10 l');
 // One event even when the physical submit button receives two clicks.
 await page.getByRole('button',{name:'Nachguss erfassen',exact:false}).click();await page.locator('#value').fill('1');await page.locator('dialog button[type=submit]').evaluate(b=>{b.click();b.click();});await expect(page.locator('dialog')).not.toBeVisible();await waitSave(page);await expect(page.locator('.water-card')).toContainText('27,5 l');
 await page.getByRole('link',{name:'Ablauf & Chronik',exact:true}).click();const last=page.locator('.timeline li').filter({has:page.getByText('Nachguss',{exact:true})}).first();await last.getByRole('button',{name:'Korrigieren / Freigabe'}).click();await page.locator('#value').fill('2');await modalSave(page);
 await page.locator('.timeline li').filter({has:page.getByText('Nachguss',{exact:true})}).first().getByRole('button',{name:'Rückgängig',exact:true}).click();await modalSave(page);
 await page.getByRole('link',{name:'Braumodus',exact:true}).click();await expect(page.locator('.water-card')).toContainText('26,5 l');await page.reload();await expect(page.locator('.water-card')).toContainText('26,5 l');
 for(let n=0;n<40;n++){
  const action=page.locator('#step-action');if(!await action.count())break;
  const id=await action.getAttribute('data-step');
  if(['carafa','bitter','whirlpool-add','yeast'].includes(id)){await action.click();if(id==='yeast')await page.locator('#value').fill('1');if(id==='whirlpool-add')await page.locator('#temperature').check();await modalSave(page);}
  else if(id==='bottle'){await action.click();await page.locator('#volume').fill('20');await modalSave(page);}
  else if(['rest-62','rest-72','mash-out','boil','whirlpool'].includes(id)){
   await action.click();await waitSave(page);
   if(id==='rest-62'){await page.reload();await expect(page.locator('#timer')).toContainText('Demo: 3 Sekunden');await page.getByRole('link',{name:'Chargenbuch',exact:true}).click();await page.waitForTimeout(3200);await page.getByRole('link',{name:'Braumodus',exact:true}).click();}
   await expect(page.locator('#step-action')).toHaveText('Zeit erreicht – Schritt abschließen',{timeout:5000});await page.screenshot({path:`test-results/${info.project.name}-brew.png`,fullPage:true});await next(page);
  }else await next(page);
  await noOverflow(page);
 }
 await expect(page.getByRole('heading',{name:'Dein Sud ist genussbereit.'})).toBeVisible();
 await page.getByRole('button',{name:'Notiz',exact:true}).click();await page.locator('#event-text').fill('GEHEIM Nur für mich');await modalSave(page);
 await page.getByRole('button',{name:'+ Verkostung',exact:true}).click();await page.locator('#event-text').fill('Demo-Verkostung – freigegeben. '+('LangerText'.repeat(40)));await page.locator('#public').check();await modalSave(page);await noOverflow(page);
 await page.getByRole('button',{name:'Öffentliche Vorschau & Export',exact:true}).click();await page.locator('#basics').check();await page.locator('#ingredients').check();await page.locator('dialog button[type=submit]').click();await expect(page.locator('dialog')).not.toBeVisible();await page.waitForTimeout(450);await expect(page.locator('main')).not.toContainText('GEHEIM');
 const pubPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Öffentlichen Stand exportieren',exact:true}).click();const pub=JSON.parse(await readFile(await(await pubPromise).path(),'utf8'));expect(JSON.stringify(pub)).not.toContain('GEHEIM');expect(pub.notes).toHaveLength(1);expect(pub).not.toHaveProperty('audit');await noOverflow(page);
 await page.waitForTimeout(450);await page.getByRole('link',{name:'Zurück zum Chargenbuch'}).click();await page.waitForTimeout(450);const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Vollständige Sicherung',exact:false}).click();const backupPath=await(await backupPromise).path();const saved=JSON.parse(await readFile(backupPath,'utf8'));expect(saved.batch.steps.every(s=>s.status==='done')).toBe(true);expect(saved.batch.events.filter(e=>e.stepId==='yeast')).toHaveLength(1);
 await page.waitForTimeout(450);await page.getByRole('link',{name:'Brauraum',exact:true}).click();await page.getByRole('button',{name:'Sicherung importieren',exact:false}).click();await page.locator('#backup-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.locator('dialog button[type=submit]').click();await expect(page.locator('#modal-error')).toContainText('kein lesbares JSON');await page.locator('#backup-file').setInputFiles(backupPath);await modalSave(page);await expect(page.locator('.page-title')).toContainText('Importkopie');expect(errors).toEqual([]);
});
test('Rezeptbearbeitung, Eingabevalidierung und Snapshot',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Neuen Sud anlegen',exact:true}).click();await expect(page.locator('#name')).toBeVisible();await page.locator('#name').fill('Mein Testalt');await waitSave(page);await page.locator('#water-sparge').fill('15,5');await waitSave(page);await page.locator('#ia-0').fill('3,2');await waitSave(page);await page.reload();await expect(page.locator('#name')).toHaveValue('Mein Testalt');await expect(page.locator('#water-sparge')).toHaveValue('15,5');await expect(page.locator('#malt-total')).toContainText('5,532 kg');await noOverflow(page);
 await page.getByRole('link',{name:'Braumodus',exact:true}).click();await expect(page.locator('#fast')).toHaveCount(0);await page.getByRole('button',{name:'Messwert',exact:true}).click();await page.locator('#event-kind').selectOption('extract');await page.locator('#value').fill('-1');await page.locator('#method').fill('Spindel');await page.locator('dialog button[type=submit]').click();await expect(page.locator('#modal-error')).toContainText('nicht negative');await page.locator('#value').fill('12,3');await modalSave(page);
 await page.getByRole('link',{name:'Chargenbuch',exact:true}).click();await expect(page.locator('main')).toContainText('12,3 °P');await expect(page.locator('main')).toContainText('Spindel');
});
test('Offline-Wiederaufruf, öffentliche Demo ohne private Daten und Unterpfad',async({page,context},info)=>{
 await page.goto('./#/public/demo');await expect(page.getByRole('heading',{name:'NOR APA Altbier',exact:true})).toBeVisible();await expect(page.locator('main')).toContainText('Synthetische Beispielcharge');await noOverflow(page);await page.screenshot({path:`test-results/${info.project.name}-public.png`,fullPage:true});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 expect(await page.evaluate(async()=> (await navigator.serviceWorker.ready).scope)).toBe('http://127.0.0.1:4173/brauprotokoll/');
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'NOR APA Altbier',exact:true})).toBeVisible();await page.goto('./');await expect(page.getByRole('heading',{name:'Gutes Bier. Schritt für Schritt.'})).toBeVisible();await demo(page);await expect(page.locator('#step-action')).toBeVisible();await context.setOffline(false);
});
test('Speicherfehler bleibt sichtbar, offene Daten lassen sich sichern und erneut speichern',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Neuen Sud anlegen',exact:true}).click();await waitSave(page);
 await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Test: Speicher voll','QuotaExceededError');};});
 await page.locator('#name').fill('Ungespeicherter Testname');await expect(page.locator('#save-status')).toContainText('Nicht gespeichert');
 await page.getByRole('link',{name:'Chargenbuch',exact:true}).click();await expect(page.locator('.page-title')).toContainText('Ungespeicherter Testname');const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Vollständige Sicherung',exact:false}).click();const b=JSON.parse(await readFile(await(await promise).path(),'utf8'));expect(b.batch.name).toBe('Ungespeicherter Testname');
 await page.evaluate(()=>IDBObjectStore.prototype.put=window.originalPut);await page.waitForTimeout(450);await page.getByRole('button',{name:'Erneut lokal speichern'}).click();await waitSave(page);await page.reload();await expect(page.locator('.page-title')).toContainText('Ungespeicherter Testname');
});
test('Zweiter Tab überschreibt keine zwischenzeitliche Änderung',async({page,context})=>{
 await page.goto('./');await page.getByRole('button',{name:'Neuen Sud anlegen',exact:true}).click();await waitSave(page);const other=await context.newPage();await other.goto(page.url());await expect(other.locator('#name')).toBeVisible();await page.locator('#name').fill('Erster Tab gewinnt');await waitSave(page);await other.locator('#name').fill('Zweiter Tab Konflikt');await expect(other.locator('#save-status')).toContainText('Nicht gespeichert');await expect(other.locator('#prep-error')).toContainText('anderen Tab');await page.reload();await expect(page.locator('#name')).toHaveValue('Erster Tab gewinnt');
});
