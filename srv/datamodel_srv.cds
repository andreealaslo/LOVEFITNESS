using app.datamodel from '../db/datamodel';

service CatalogService {

    entity USERS                           as projection on datamodel.USERS;
    entity MUSCLE_GROUPS                   as projection on datamodel.MUSCLE_GROUPS;
    entity MEDICAL_AFFECTIONS              as projection on datamodel.MEDICAL_AFFECTIONS;
    entity USERS_AND_MEDICAL_AFFECTIONS    as projection on datamodel.USERS_AND_MEDICAL_AFFECTIONS;
    entity EXERCISES                       as projection on datamodel.EXERCISES;
    entity FITNESS_MACHINES                as projection on datamodel.FITNESS_MACHINES;
    entity EXERCISES_ON_FITNESS_MACHINES   as projection on datamodel.EXERCISES_ON_FITNESS_MACHINES;
    entity USER_EXERCISES                  as projection on datamodel.USER_EXERCISES;
    entity WORKOUT_TYPES                   as projection on datamodel.WORKOUT_TYPES;
    entity WORKOUT_PLACES                  as projection on datamodel.WORKOUT_PLACES;
    entity WORKOUTS                        as projection on datamodel.WORKOUTS;
    entity FITNESS_MACHINE_TIPS_AND_TRICKS as projection on datamodel.FITNESS_MACHINE_TIPS_AND_TRICKS;
    entity WORKOUT_HISTORY                 as projection on datamodel.WORKOUT_HISTORY;
    entity CHALLENGES                      as projection on datamodel.CHALLENGES;
    entity USER_CHALLENGES                 as projection on datamodel.USER_CHALLENGES;
    entity FRIENDS                         as projection on datamodel.FRIENDS;
    entity LEVEL_HISTORY                   as projection on datamodel.LEVEL_HISTORY;

    function showMedicalAffectionsForMuscles(muscleAffected : String) returns String;
    function rankForExercise(userEmail : String, exercise : String)   returns String;
    function generateBadge(userEmail : String)                        returns String;
    function increaseLevel(userEmail : String)                        returns Boolean;
    function test()                                                   returns String;
    function getUUID()                                                returns String(32);

}
