import { Injectable, inject  } from '@angular/core';
import { Note } from '../interfaces/note.interface'
import { Firestore, collectionData, collection, doc, onSnapshot, addDoc,updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {
  normalNotes: Note[] = [];
  trashNotes: Note[] = [];

  unsubNotes;
  unsubTrash;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubTrash = this.subTrashList();
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        (err) => { console.log(err); }
      );
      
    }
  }

  getCleanJson(note:Note):{} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    }
  }

  getColIdFromNote(note:Note) {
    if (note.type == 'note') {
      return 'notes';
    } else {
      return 'trash';
    }
  }

  async addNote(item: Note) {
    await addDoc(this.getNotesRef(), item).catch(
      (err) => { console.error(err) }
    ).then(
      (docRef) => { console.log('Document written with ID: ', docRef?.id); }
    );
  }

  ngonDestroy() {
    this.unsubNotes();
    this.unsubTrash();
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id || '',
      type: obj.type || 'note',
      title: obj.title || '',
      content: obj.content || '',
      marked: obj.marked || false,
    }
  }

  subNotesList(){
    return onSnapshot(this.getNotesRef(), (list) => {
      this.normalNotes = [];
      list.forEach(element => {
        console.log(this.setNoteObject(element.data(), element.id));
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subTrashList(){
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach(element => {
        console.log(this.setNoteObject(element.data(), element.id));
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDocRef(colId:string, docId:string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
