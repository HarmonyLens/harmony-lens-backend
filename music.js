const MidiWriter = require("midi-writer-js");
const fs = require("fs");
const raw = fs.readFileSync("./music.json");
const jsonData = JSON.parse(raw);

// Create a new MIDI track
const track = new MidiWriter.Track();

// Set the tempo (optional)
const tempo = jsonData.tempo || 120;
// track.addEvent(
//   new MidiWriter.MetaEvent({
//     type: "setTempo",
//     microsecondsPerBeat: MidiWriter.Utils.bpmToMicrosecondsPerBeat(tempo),
//   })
// );

// Iterate over each section in the song
for (const section of jsonData.sections) {
  // Iterate over each note in the section
  for (const note of section.notes) {
    const [pitch, duration] = note;
    // Calculate the MIDI note number
    // const noteNumber = MidiWriter.Utils.noteNameToNoteNumber(pitch);
    // Calculate the time duration in ticks based on the tempo
    // const tickDuration = MidiWriter.Utils.durationToTicks(duration);
    // Add the note-on and note-off events to the track
    track.addEvent(
      new MidiWriter.NoteEvent({ pitch: pitch, duration: duration })
    );
  }
}

// Create a new MIDI file
const write = new MidiWriter.Writer([track]);

// Convert the MIDI data to bytes
const data = write.buildFile();
const byteArray = new Uint8Array(data);

// Save the MIDI file
fs.writeFileSync("sad_song.mid", Buffer.from(byteArray));
