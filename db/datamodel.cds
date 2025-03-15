namespace app.datamodel;

using {
  cuid,
  managed
} from '@sap/cds/common';

entity USERS : managed {
  key EMAIL              : String;
      DATE_OF_BIRTH      : Date;
      HEIGHT             : Integer;
      WEIGHT             : Integer;
      MEDICAL_AFFECTIONS : Association to many USERS_AND_MEDICAL_AFFECTIONS
                             on MEDICAL_AFFECTIONS.USER = $self;
      CHALLENGES         : Association to many USER_CHALLENGES
                             on CHALLENGES.USER = $self;
      LEVEL              : Integer;
      LEVEL_HISTORY      : Association to many LEVEL_HISTORY
                             on LEVEL_HISTORY.USER = $self;

}

entity MUSCLE_GROUPS : cuid, managed {
  NAME              : String;
  MEDICAL_AFFECTION : Association to many MEDICAL_AFFECTIONS
                        on MEDICAL_AFFECTION.MUSCLE_AFFECTED = $self;
  EXERCISES         : Association to many EXERCISES
                        on EXERCISES.MUSCLE_GROUP = $self;
}

entity MEDICAL_AFFECTIONS : cuid, managed {
  DESCRIPTION     : String;
  MUSCLE_AFFECTED : Association to MUSCLE_GROUPS;
}

entity USERS_AND_MEDICAL_AFFECTIONS : cuid, managed {
  USER              : Association to USERS;
  MEDICAL_AFFECTION : Association to MEDICAL_AFFECTIONS;
}

entity EXERCISES : cuid, managed {
  NAME            : String;
  MUSCLE_GROUP    : Association to many MUSCLE_GROUPS;
  SUPERSET        : Boolean;
  DROPSET         : Boolean;
  NEXT_EXERCISE   : Association to EXERCISES;
  FITNESS_MACHINE : Association to many EXERCISES_ON_FITNESS_MACHINES
                      on FITNESS_MACHINE.EXERCISE = $self;
  DESCRIPTION     : String;

}

entity FITNESS_MACHINES : cuid, managed {
  NAME            : String;
  DESCRIPTION     : String;
  EXERCISES       : Association to many EXERCISES_ON_FITNESS_MACHINES
                      on EXERCISES.FITNESS_MACHINE = $self;
  TIPS_AND_TRICKS : Association to many FITNESS_MACHINE_TIPS_AND_TRICKS
                      on TIPS_AND_TRICKS.FITNESS_MACHINE = $self;
  MUSCLE_ZONE     : String;
  APPROVED        : String;
  CREATION_EMAIL  : String;
  NOTIFIED        : Boolean;
}

entity EXERCISES_ON_FITNESS_MACHINES : cuid, managed {
  FITNESS_MACHINE : Association to FITNESS_MACHINES;
  EXERCISE        : Association to EXERCISES;
}

entity USER_EXERCISES : cuid, managed { //one set is a new UserExercise
  DATE           : Date;
  USER           : Association to USERS;
  EXERCISE       : Association to EXERCISES_ON_FITNESS_MACHINES;
  WEIGHT         : Integer;
  NUMBER_OF_REPS : Integer;
  WORKOUT        : Association to WORKOUTS;
}

entity WORKOUT_TYPES : cuid, managed {
  TYPE : String;
}

entity WORKOUT_PLACES : cuid, managed {
  PLACE : String;
}

entity WORKOUTS : cuid, managed {
  USER      : Association to USERS;
  TYPE      : Association to WORKOUT_TYPES;
  PLACE     : Association to WORKOUT_PLACES;
  NAME      : String;
  EXERCISES : Association to many USER_EXERCISES
                on EXERCISES.WORKOUT = $self;
  HISTORY   : Association to many WORKOUT_HISTORY
                on HISTORY.WORKOUT = $self;
}

entity FITNESS_MACHINE_TIPS_AND_TRICKS : cuid, managed {
  FITNESS_MACHINE : Association to FITNESS_MACHINES;
  DESCRIPTION     : String;
  APPROVED        : String;
  CREATION_EMAIL  : String;
  NOTIFIED        : Boolean;
  
}

entity WORKOUT_HISTORY : cuid, managed {
  DATE    : Date;
  WORKOUT : Association to WORKOUTS;
  TIME    : String;
}

entity CHALLENGES : cuid, managed {
  DESCRIPTION : String;
}

entity USER_CHALLENGES : cuid, managed {
  CHALLENGE  : Association to CHALLENGES;
  USER       : Association to USERS;
  STATUS     : String;
  START_DATE : Date;
  END_DATE   : Date;
}

entity FRIENDS : cuid, managed {
  REQUESTER : Association to USERS;
  RECEIVER  : Association to USERS;
  STATUS    : String;
  SINCE     : Date;
}

entity LEVEL_HISTORY : cuid, managed {
  USER        : Association to USERS;
  DESCIRPTION : String;
  OLD_LEVEL   : Integer;
  NEW_LEVEL   : Integer;
}
