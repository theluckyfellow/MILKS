class ChatE
{
  constructor(type,str)
  {
   this.type = type;//0 sys, 1 super sys, 2 user, 3 bot
   this.str = str;
  }
  
  getType()
  {
    return this.type; 
  }
  
  getStr()
  {
    return this.str; 
  }
  
  
}
