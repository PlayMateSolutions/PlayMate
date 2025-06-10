import { NgModule } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Storage } from '@ionic/storage-angular';

@NgModule({
  imports: [
    IonicStorageModule.forRoot({
      name: 'playmate_db',
      driverOrder: ['indexeddb', 'localstorage']
    })
  ],
  providers: [Storage]
})
export class StorageModule {
  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
  }
}
