import { createSchema, Type, typedModel,ExtractDoc, ExtractProps } from 'ts-mongoose';
import { type } from 'os';
const PersonSchema = createSchema(
  {
    name: Type.string({ required: true }),
    email: Type.string({unique: true, required: true, index: true}),
    points: Type.number({default: 0, required: true, index:true})
  },
  { _id: true, timestamps: true }
);
export const Person = typedModel('Person', PersonSchema, undefined, undefined, {
  findByEmail: function(email: string) {
    return this.find({ email });
  }
});
export type PersonDoc = ExtractDoc<typeof PersonSchema>;
export type PersonProps = ExtractProps<typeof PersonSchema>;


const MatchSchema = createSchema(
  {
    name: Type.string({required: true}),
    members: Type.array().of({
      people: Type.array().of(Type.ref(Type.objectId()).to('Person', PersonSchema)),
      points: Type.number({ required: true })
    }),
  },
  { _id: true, timestamps: true }
);
export const Match = typedModel('Match', MatchSchema);
export type MatchDoc = ExtractDoc<typeof MatchSchema>;
export type MatchProps = ExtractProps<typeof MatchSchema>;
