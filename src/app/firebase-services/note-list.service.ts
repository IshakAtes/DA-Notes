import { Injectable, inject  } from '@angular/core';
import { Note } from '../interfaces/note.interface'
import { Firestore, collectionData, collection, query, where, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteListService {
  normalNotes: Note[] = [];
  markedNotes: Note[] = [];
  trashNotes: Note[] = [];

  unsubNotes;
  unsubMarkedNotes;
  unsubTrash;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
    this.unsubTrash = this.subTrashList();
  }

  async deleteNote(colId: 'notes' | 'trash', docId: string) {
    console.log('trash', this.trashNotes);
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(
      (err) => { console.log(err) }
    )
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      console.log(note.type);
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

  async addNote(item:Note , colId: 'notes' | 'trash'){
    if(colId == 'trash'){
      await addDoc(this.getTrashRef(), item)
    } else {
      await addDoc(this.getNotesRef(), item).catch(
        (err) => {console.error(err)}
      ).then(
        (docRef) => {console.log('Document written ID:', docRef?.id)}
      )
    }
  }

  ngonDestroy() {
    this.unsubNotes();
    this.unsubMarkedNotes();
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

  subMarkedNotesList(){
    const q = query(this.getNotesRef(), where("marked", "==", true));
    return onSnapshot(q, (list) => {
      this.markedNotes = [];
      list.forEach(element => {
        this.markedNotes.push(this.setNoteObject(element.data(), element.id));
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
