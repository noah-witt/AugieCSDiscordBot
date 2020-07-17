import { createSchema, Type, typedModel,ExtractDoc, ExtractProps } from 'ts-mongoose';
const PersonSchema = createSchema(
  {
    name: Type.string({ required: true }),
    email: Type.string({unique: true, required: true, index: true})
  },
  { _id: true, timestamps: true }
);
export const Person = typedModel('Person', PersonSchema, undefined, undefined, {
  findByEmail: function(email) {
    return this.find({ email });
  }
});
export type PersonDoc = ExtractDoc<typeof PersonSchema>;
export type PersonProps = ExtractProps<typeof PersonSchema>;
const matchTypes = ['team', 'individual'] as const;
const MatchSchema = createSchema(
  {
     type: Type.string({ required: true, enum: matchTypes }),
     members: Type.array().of(Type.object().of({
      people: Type.array().of(Type.ref(Type.objectId()).to('Person', PersonSchema)),
      points: Type.number({ required: true }),
      win: Type.boolean({ required: true}),
    })),
  },
  { _id: true, timestamps: true }
);
export const Match = typedModel('Match', MatchSchema);
export type MatchDoc = ExtractDoc<typeof MatchSchema>;
export type MatchProps = ExtractProps<typeof MatchSchema>;
